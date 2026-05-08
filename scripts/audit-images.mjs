#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import matter from 'gray-matter'
import { resolveFilesystemAsset, resolveFilesystemMediaAsset, normalizeProjectPath } from './lib/asset-registry.mjs'

const projectRoot = process.cwd()
const contentRoot = path.join(projectRoot, 'src', 'content', 'pages')
const publicRoot = path.join(projectRoot, 'public')

const IMAGE_EXT_RE = /\.(png|jpe?g|webp|gif|svg|avif)$/i
const RASTER_EXT_RE = /\.(png|jpe?g|gif)$/i
const MARKDOWN_INDEX = 'index.md'
const STRICT = process.argv.includes('--strict')

const SIZE_LIMITS = {
  cover: 1.2 * 1024 * 1024,
  hero: 1.2 * 1024 * 1024,
  og: 1.2 * 1024 * 1024,
  inline: 900 * 1024,
  gallery: 1.5 * 1024 * 1024,
  thumbnail: 300 * 1024,
  'video-poster': 700 * 1024,
}

const FRONTMATTER_ASSET_FIELDS = [
  ['cover', 'cover'],
  ['thumbnail', 'thumbnail'],
  ['cardCover', 'cover'],
  ['cardIcon', 'thumbnail'],
  ['ogImage', 'og'],
]

const PRODUCT_IMAGE_FIELDS = [
  ['image', 'cover'],
  ['cover', 'cover'],
  ['thumbnail', 'thumbnail'],
  ['thumb', 'thumbnail'],
  ['ogImage', 'og'],
]

const DIRECTIVE_ASSET_FIELDS = {
  'captioned-image': [['src', 'inline']],
  'before-after': [['before', 'gallery'], ['after', 'gallery']],
  'image-card': [['src', 'inline']],
  'work-card': [['cover', 'cover']],
  video: [['poster', 'video-poster']],
  'video-player': [['poster', 'video-poster']],
  'gallery-strip': [],
}

function toProjectPath(filePath) {
  return normalizeProjectPath(path.relative(projectRoot, filePath))
}

function bytes(value) {
  if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(2)}MB`
  if (value >= 1024) return `${Math.round(value / 1024)}KB`
  return `${value}B`
}

function isInside(parent, child) {
  const rel = path.relative(parent, child)
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel))
}

function walkFiles(dir, predicate = () => true) {
  const results = []
  if (!existsSync(dir)) return results
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue
      results.push(...walkFiles(fullPath, predicate))
    } else if (entry.isFile() && predicate(fullPath)) {
      results.push(fullPath)
    }
  }
  return results.sort()
}

function walkMarkdownIndexFiles(dir) {
  return walkFiles(dir, (file) => path.basename(file) === MARKDOWN_INDEX)
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
  const re = /!\[(?<alt>[^\]]*)\]\((?<target>[^)\s]+)(?:\s+["'](?<title>[^"']*)["'])?\)/g
  let match
  while ((match = re.exec(raw))) {
    if (match.groups?.target) {
      targets.push({
        source: match.groups.target.trim(),
        alt: String(match.groups.alt || '').trim(),
        title: String(match.groups.title || '').trim(),
      })
    }
  }
  return targets
}

function resolveRef(ref, file) {
  const isVideoPoster = ref.role === 'video-poster'
  const resolution = isVideoPoster
    ? resolveFilesystemMediaAsset({ source: ref.source, contentFilePath: file, projectRoot, contentRoot, publicRoot, expectedType: 'image' })
    : resolveFilesystemAsset({ source: ref.source, contentFilePath: file, projectRoot, contentRoot, publicRoot })
  return { ...ref, resolution }
}

function collectRefs(file, raw, parsed) {
  const refs = []
  for (const [field, role] of FRONTMATTER_ASSET_FIELDS) {
    const value = parsed.data?.[field]
    if (typeof value === 'string' && value.trim()) refs.push({ field: `frontmatter.${field}`, source: value, role })
  }

  if (parsed.data?.product && typeof parsed.data.product === 'object') {
    for (const [field, role] of PRODUCT_IMAGE_FIELDS) {
      const value = parsed.data.product[field]
      if (typeof value === 'string' && value.trim()) refs.push({ field: `product.${field}`, source: value, role })
    }
  }

  for (const [name, fields] of Object.entries(DIRECTIVE_ASSET_FIELDS)) {
    for (const block of iterDirectiveBlocks(parsed.content, name)) {
      const attrs = parseDirectiveAttrs(block)
      for (const [field, role] of fields) {
        if (attrs[field]) refs.push({ field: `${name}.${field}`, source: attrs[field], role })
      }
      if (name === 'gallery-strip') {
        for (const item of parseGalleryStripItems(block)) {
          refs.push({ field: 'gallery-strip.src', source: item.src, role: 'gallery' })
          if (item.thumb) refs.push({ field: 'gallery-strip.thumb', source: item.thumb, role: 'thumbnail' })
          else refs.push({ field: 'gallery-strip.thumb', source: '', role: 'thumbnail', missingThumbFor: item.src })
        }
      }
    }
  }

  for (const item of parseMarkdownImageTargets(parsed.content)) {
    refs.push({ field: 'markdown-image.src', source: item.source, role: 'inline', alt: item.alt, title: item.title })
  }

  return refs.map((ref) => resolveRef(ref, file))
}

function collectCsvRefs(csvFile) {
  const raw = readFileSync(csvFile, 'utf8').replace(/\r\n/g, '\n')
  const lines = raw.split('\n').filter(Boolean)
  if (lines.length < 2) return []
  const header = lines[0].split(',').map((item) => item.trim())
  const imageIndexes = header
    .map((name, index) => ({ name, index }))
    .filter((item) => /^(image|thumb|thumbnail|cover|ogImage|poster)$/i.test(item.name))
  const refs = []
  for (const line of lines.slice(1)) {
    const cells = line.split(',').map((item) => item.trim())
    for (const item of imageIndexes) {
      const value = cells[item.index]
      if (value) refs.push(resolveRef({ field: `csv.${item.name}`, source: value, role: /thumb/i.test(item.name) ? 'thumbnail' : 'cover' }, csvFile))
    }
  }
  return refs
}

function pageMeta(file, parsed) {
  const relative = toProjectPath(file)
  const parts = relative.split('/')
  const category = parts[2] || ''
  const isCollectionIndex = parts.length === 4 && parts[0] === 'src' && parts[1] === 'content' && parts[2] === 'pages'
  const isProductDetail = /^src\/content\/pages\/products\/[^/]+\/index\.md$/.test(relative) && !relative.startsWith('src/content/pages/products/categories/')
  const visible = parsed.data?.status !== 'draft' && parsed.data?.visibility !== 'hidden' && parsed.data?.visibility !== 'private'
  return { relative, category, isCollectionIndex, isProductDetail, visible }
}

function issue(warnings, file, code, message) {
  warnings.push({ file, code, message })
}

function checkPageRepresentativeImages({ file, parsed, refs, warnings }) {
  const meta = pageMeta(file, parsed)
  if (!meta.visible) return

  const hasCover = refs.some((ref) => ref.field === 'frontmatter.cover' || ref.field === 'frontmatter.cardCover')
  const hasThumbnail = refs.some((ref) => ref.field === 'frontmatter.thumbnail' || ref.field === 'frontmatter.cardIcon')
  const hasOgImage = refs.some((ref) => ref.field === 'frontmatter.ogImage')

  if (!hasCover) issue(warnings, meta.relative, 'missing-cover', 'frontmatter cover is recommended for cards and previews')
  if (!hasThumbnail) issue(warnings, meta.relative, 'missing-thumbnail', 'frontmatter thumbnail is recommended for listing and gallery surfaces')
  if (!hasOgImage) issue(warnings, meta.relative, 'missing-og-image', 'frontmatter ogImage is recommended before launch')

  if (meta.isProductDetail) {
    const hasProductRepresentative = refs.some((ref) => /^product\.(image|cover|thumbnail|thumb)$/.test(ref.field)) || hasCover || hasThumbnail
    if (!hasProductRepresentative) {
      issue(warnings, meta.relative, 'missing-product-representative-image', 'product detail pages should declare a representative product image')
    }
  }
}

function checkRefWarnings({ file, ref, warnings }) {
  const rel = toProjectPath(file)
  if (ref.missingThumbFor) {
    issue(warnings, rel, 'gallery-thumb-missing', `gallery-strip item has no thumb for ${ref.missingThumbFor}`)
    return
  }

  if (ref.field === 'markdown-image.src' && !ref.alt) {
    issue(warnings, rel, 'markdown-image-alt-missing', `${ref.source} has an empty alt text`)
  }

  if (ref.resolution?.warning && ref.resolution?.found) {
    issue(warnings, rel, 'asset-resolution-warning', `${ref.field}: ${ref.source} -> ${ref.resolution.warning}`)
  }
}

function checkFileName(absPath, warnings) {
  const rel = toProjectPath(absPath)
  const ext = path.extname(absPath).toLowerCase()
  const base = path.basename(absPath, ext)
  const name = path.basename(absPath)

  if (/\s/.test(name)) issue(warnings, rel, 'image-name-space', 'image filenames should not contain spaces')
  if (/[A-Z]/.test(name)) issue(warnings, rel, 'image-name-uppercase', 'image filenames should stay lowercase')
  if (/[()]/.test(name)) issue(warnings, rel, 'image-name-parentheses', 'image filenames should not contain parentheses')
  if (/[^\x00-\x7F]/.test(name)) issue(warnings, rel, 'image-name-non-ascii', 'image filenames should avoid non-ASCII characters')
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(base)) issue(warnings, rel, 'image-name-not-kebab-case', 'image filename base should use kebab-case')
  if (/(^|[-_\s])final([-_\s]+final)+($|[-_\s])/i.test(base) || /final-final/i.test(base)) {
    issue(warnings, rel, 'image-name-final-chain', 'image filename looks like a final-final revision chain')
  }
}

function roleLimit(roles) {
  if (!roles.length) return { role: 'inline', limit: SIZE_LIMITS.inline }
  const ranked = roles
    .map((role) => ({ role, limit: SIZE_LIMITS[role] || SIZE_LIMITS.inline }))
    .sort((a, b) => a.limit - b.limit)
  return ranked[0]
}

function checkImageFile(absPath, roles, warnings) {
  checkFileName(absPath, warnings)
  const rel = toProjectPath(absPath)
  const ext = path.extname(absPath).toLowerCase()
  const stat = statSync(absPath)
  const { role, limit } = roleLimit(roles)

  if (stat.size > limit) {
    issue(warnings, rel, 'image-size-large', `${role} image is ${bytes(stat.size)}; recommended limit is ${bytes(limit)}`)
  }

  if (RASTER_EXT_RE.test(ext)) {
    issue(warnings, rel, 'prefer-webp', `${ext.replace('.', '')} is allowed, but webp is recommended for launch assets`)
  }
}

const markdownFiles = walkMarkdownIndexFiles(contentRoot)
const csvFiles = walkFiles(contentRoot, (file) => path.basename(file) === 'page.csv')
const contentImageFiles = walkFiles(contentRoot, (file) => IMAGE_EXT_RE.test(file))
const publicImageFiles = walkFiles(publicRoot, (file) => IMAGE_EXT_RE.test(file))
const allImageFiles = [...contentImageFiles, ...publicImageFiles]

const warnings = []
const refs = []

for (const file of markdownFiles) {
  const raw = readFileSync(file, 'utf8')
  const parsed = matter(raw)
  const fileRefs = collectRefs(file, raw, parsed)
  refs.push(...fileRefs)
  checkPageRepresentativeImages({ file, parsed, refs: fileRefs, warnings })
  for (const ref of fileRefs) checkRefWarnings({ file, ref, warnings })
}

for (const csvFile of csvFiles) refs.push(...collectCsvRefs(csvFile))

const rolesByPath = new Map()
for (const ref of refs) {
  const absPath = ref.resolution?.absolutePath
  if (!absPath || !IMAGE_EXT_RE.test(absPath) || !existsSync(absPath)) continue
  if (!isInside(contentRoot, absPath) && !isInside(publicRoot, absPath)) continue
  const key = path.resolve(absPath)
  const roles = rolesByPath.get(key) || []
  roles.push(ref.role || 'inline')
  rolesByPath.set(key, roles)
}

for (const file of allImageFiles) {
  checkImageFile(file, rolesByPath.get(path.resolve(file)) || [], warnings)
}

const missingRefs = refs.filter((ref) => ref.source && ref.resolution && !ref.resolution.found)
for (const ref of missingRefs) {
  issue(warnings, ref.resolution?.relativePath || ref.source, 'referenced-image-missing', `${ref.field}: ${ref.source} -> ${ref.resolution.reason}`)
}

const uniqueCodes = [...new Set(warnings.map((item) => item.code))].sort()

console.log('Image Audit')
console.log('')
console.log('Summary')
console.log(`  markdown pages scanned: ${markdownFiles.length}`)
console.log(`  page.csv files scanned: ${csvFiles.length}`)
console.log(`  image files scanned: ${allImageFiles.length}`)
console.log(`  image refs scanned: ${refs.filter((ref) => ref.source).length}`)
console.log(`  warnings: ${warnings.length}`)
console.log(`  strict: ${STRICT ? 'true' : 'false'}`)
console.log('')

if (warnings.length) {
  console.log('Warnings')
  for (const item of warnings) {
    console.log(`  - [${item.code}] ${item.file}: ${item.message}`)
  }
  console.log('')
}

console.log(`Warning codes: ${uniqueCodes.length ? uniqueCodes.join(', ') : 'none'}`)

if (STRICT && warnings.length) {
  console.error('[audit:images] strict mode failed because warnings were found')
  process.exit(1)
}

console.log('[audit:images] OK image audit completed')
