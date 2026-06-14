import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import matter from 'gray-matter'
import { resolveFilesystemAsset, resolveFilesystemMediaAsset } from './lib/asset-registry.mjs'

const projectRoot = process.cwd()
const contentRoot = path.join(projectRoot, 'src', 'content', 'pages')
const publicRoot = path.join(projectRoot, 'public')
const FRONTMATTER_ASSET_FIELDS = ['cover', 'thumbnail', 'cardCover', 'cardIcon', 'ogImage']
const DIRECTIVE_ASSET_FIELDS = {
  'captioned-image': ['src'],
  'before-after': ['before', 'after'],
  'image-card': ['src'],
  'work-card': ['cover'],
  'video': ['src', 'fallback', 'poster', 'stream'],
  'video-player': ['src', 'poster', 'stream'],
  'gallery-strip': [],
}

function toProjectPath(filePath) {
  return path.relative(projectRoot, filePath).replace(/\\/g, '/')
}

function walkMarkdownIndexFiles(dir) {
  const results = []
  if (!existsSync(dir)) return results
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) results.push(...walkMarkdownIndexFiles(fullPath))
    else if (entry.isFile() && entry.name === 'index.md') results.push(fullPath)
  }
  return results.sort()
}

function parseDirectiveAttrs(rawBlock) {
  const attrs = {}
  const lines = rawBlock.replace(/\r\n/g, '\n').split('\n').slice(1, -1)
  for (const line of lines) {
    const match = line.match(/^([a-zA-Z][a-zA-Z0-9_-]*):\s*(.*)$/)
    if (!match) continue
    attrs[match[1]] = match[2].trim()
  }
  return attrs
}

function iterDirectiveBlocks(raw, name) {
  const blocks = []
  const lines = raw.replace(/\r\n/g, '\n').split('\n')
  let inFence = false
  let i = 0
  const trim = (index) => (lines[index] || '').trim()

  while (i < lines.length) {
    const line = lines[i] || ''
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence
      i += 1
      continue
    }
    if (inFence || trim(i) !== `::${name}`) {
      i += 1
      continue
    }

    if (name === 'markdown-box' || name === 'gallery-strip') {
      let separator = i + 1
      while (separator < lines.length && trim(separator) !== '::') separator += 1
      if (separator >= lines.length) {
        i += 1
        continue
      }
      let end = separator + 1
      while (end < lines.length && trim(end) !== '::') end += 1
      if (end < lines.length) {
        blocks.push(lines.slice(i, end + 1).join('\n'))
        i = end + 1
        continue
      }
      i += 1
      continue
    }

    let end = i + 1
    while (end < lines.length && trim(end) !== '::') end += 1
    if (end < lines.length) {
      blocks.push(lines.slice(i, end + 1).join('\n'))
      i = end + 1
      continue
    }
    i += 1
  }
  return blocks
}



function splitDirectiveBlock(block) {
  const lines = block.replace(/\r\n/g, '\n').split('\n')
  const inner = lines.slice(1, -1)
  const separator = inner.findIndex((line) => line.trim() === '::')
  if (separator >= 0) return { attrLines: inner.slice(0, separator), bodyLines: inner.slice(separator + 1) }
  return { attrLines: inner, bodyLines: [] }
}

function parseGalleryStripItems(block) {
  const { attrLines, bodyLines } = splitDirectiveBlock(block)
  const fallbackBodyLines = []
  for (const line of attrLines) {
    if (!/^([a-zA-Z][a-zA-Z0-9_-]*):\s*(.*)$/.test(line)) fallbackBodyLines.push(line)
  }
  return [...fallbackBodyLines, ...bodyLines]
    .join('\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .filter((line) => /^[-*+]\s+/.test(line))
    .map((line) => line.replace(/^[-*+]\s+/, '').trim())
    .map((line) => {
      const [src = '', caption = '', thumb = ''] = line.split('|').map((part) => part.trim())
      return { src, caption, thumb }
    })
    .filter((item) => item.src)
}

function parseMarkdownImageTargets(raw) {
  const targets = []
  const re = /!\[[^\]]*\]\((?<target>[^)\s]+)(?:\s+["'][^"']*["'])?\)/g
  let match
  while ((match = re.exec(raw))) {
    if (match.groups?.target) targets.push(match.groups.target.trim())
  }
  return targets
}

function collectAssetRefs(file, raw) {
  const parsed = matter(raw)
  const refs = []
  for (const field of FRONTMATTER_ASSET_FIELDS) {
    const value = parsed.data?.[field]
    if (typeof value === 'string' && value.trim()) refs.push({ field: `frontmatter.${field}`, value })
  }

  for (const [name, fields] of Object.entries(DIRECTIVE_ASSET_FIELDS)) {
    for (const block of iterDirectiveBlocks(parsed.content, name)) {
      const attrs = parseDirectiveAttrs(block)
      for (const field of fields) {
        if (attrs[field]) refs.push({ field: `${name}.${field}`, value: attrs[field] })
      }
      if (name === 'gallery-strip') {
        for (const item of parseGalleryStripItems(block)) {
          refs.push({ field: 'gallery-strip.src', value: item.src })
          if (item.thumb) refs.push({ field: 'gallery-strip.thumb', value: item.thumb })
        }
      }
    }
  }

  for (const value of parseMarkdownImageTargets(parsed.content)) {
    refs.push({ field: 'markdown-image.src', value })
  }

  return refs
}

function summarize(results) {
  const summary = { local: 0, public: 0, external: 0, data: 0, missing: 0, invalid: 0, warnings: 0, errors: 0 }
  for (const item of results) {
    summary[item.resolution.kind] = (summary[item.resolution.kind] || 0) + 1
    if (item.resolution.warning) summary.warnings += 1
    if (!item.resolution.found && item.resolution.kind !== 'missing') summary.errors += 1
    if (item.resolution.reason === 'unsafe_path' || item.resolution.reason === 'unsupported_protocol') summary.errors += 1
  }
  return summary
}

const files = walkMarkdownIndexFiles(contentRoot)
const perFile = []

for (const file of files) {
  const raw = readFileSync(file, 'utf8')
  const refs = collectAssetRefs(file, raw)
  const results = refs.map((ref) => {
    const isVideoField = /^video(-player)?\./.test(ref.field)
    const expectedType = ref.field.endsWith('.poster') ? 'image' : ref.field.endsWith('.stream') ? 'stream' : isVideoField ? 'video' : undefined
    return {
      ...ref,
      resolution: expectedType
        ? resolveFilesystemMediaAsset({ source: ref.value, contentFilePath: file, projectRoot, contentRoot, publicRoot, expectedType })
        : resolveFilesystemAsset({ source: ref.value, contentFilePath: file, projectRoot, contentRoot, publicRoot }),
    }
  })
  if (results.length) perFile.push({ file, results, summary: summarize(results) })
}

console.log('Asset Audit')
console.log('')
for (const item of perFile) {
  console.log(toProjectPath(item.file))
  console.log(`  local found: ${item.summary.local}`)
  console.log(`  public: ${item.summary.public}`)
  console.log(`  external: ${item.summary.external}`)
  console.log(`  data: ${item.summary.data}`)
  console.log(`  missing: ${item.summary.missing}`)
  console.log(`  invalid: ${item.summary.invalid}`)
  for (const result of item.results) {
    if (result.resolution.warning || !result.resolution.found) {
      console.log(`  - ${result.field}: ${result.value} -> ${result.resolution.reason}`)
    }
  }
  console.log('')
}

const all = perFile.flatMap((item) => item.results)
const summary = summarize(all)
console.log('Summary')
console.log(`  files scanned: ${files.length}`)
console.log(`  asset refs: ${all.length}`)
console.log(`  local found: ${summary.local}`)
console.log(`  public: ${summary.public}`)
console.log(`  external: ${summary.external}`)
console.log(`  data: ${summary.data}`)
console.log(`  missing: ${summary.missing}`)
console.log(`  invalid: ${summary.invalid}`)
console.log(`  warnings: ${summary.warnings}`)
console.log(`  errors: ${summary.errors}`)

if (summary.errors > 0) process.exit(1)
