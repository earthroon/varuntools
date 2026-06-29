import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const ROOT = process.cwd()
const CONTENT_ROOT = path.join(ROOT, 'src', 'content', 'pages')
const OUT_PATH = path.join(ROOT, 'src', 'content', 'generated', 'homeCollections.generated.json')
const CHECK = process.argv.includes('--check')
const SCHEMA_VERSION = 'home-collections.v1'

function normalizePath(value) {
  return value.split(path.sep).join('/')
}

function walkIndexMarkdown(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkIndexMarkdown(fullPath, out)
      continue
    }
    if (entry.isFile() && entry.name === 'index.md') out.push(fullPath)
  }
  return out
}

function readFrontmatter(raw) {
  const source = String(raw || '').replace(/^\uFEFF/, '')
  if (!source.startsWith('---')) return {}

  const closeMatch = source.slice(3).match(/\r?\n---\s*(?:\r?\n|$)/)
  if (!closeMatch || typeof closeMatch.index !== 'number') return {}

  const block = source.slice(3, 3 + closeMatch.index)
  return parseYamlSubset(block)
}

function parseYamlSubset(block) {
  const root = {}
  const stack = [{ indent: -1, value: root }]
  const lines = block.replace(/\r\n/g, '\n').split('\n')

  for (let i = 0; i < lines.length; i += 1) {
    const rawLine = lines[i]
    if (!rawLine.trim() || rawLine.trim().startsWith('#')) continue

    const indent = rawLine.match(/^\s*/)?.[0].length || 0
    const line = rawLine.trim()
    const pair = line.match(/^([A-Za-z0-9_.-]+):(?:\s*(.*))?$/)
    if (!pair) {
      const listItem = line.match(/^-\s+(.*)$/)
      if (listItem) {
        const current = stack[stack.length - 1]?.value
        if (Array.isArray(current)) current.push(parseScalar(listItem[1]))
      }
      continue
    }

    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop()
    const parent = stack[stack.length - 1].value
    if (!parent || typeof parent !== 'object' || Array.isArray(parent)) continue

    const key = pair[1]
    const valueText = pair[2] ?? ''

    if (!valueText.trim()) {
      const nextLine = lines.slice(i + 1).find((candidate) => candidate.trim() && !candidate.trim().startsWith('#')) || ''
      const nextTrimmed = nextLine.trim()
      const nextIndent = nextLine.match(/^\s*/)?.[0].length || 0
      const container = nextTrimmed.startsWith('- ') && nextIndent > indent ? [] : {}
      parent[key] = container
      stack.push({ indent, value: container })
      continue
    }

    parent[key] = parseScalar(valueText)
  }

  return root
}

function parseScalar(value) {
  const text = String(value || '').trim()
  if (!text) return ''
  if (text === 'true') return true
  if (text === 'false') return false
  if (text === 'null') return null
  if (/^-?\d+(?:\.\d+)?$/.test(text)) return Number(text)
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    return text.slice(1, -1)
  }
  if (text.startsWith('[') && text.endsWith(']')) {
    return text.slice(1, -1)
      .split(',')
      .map((item) => parseScalar(item.trim()))
      .filter((item) => item !== '')
  }
  return text.replace(/\s+#.*$/, '').trim()
}

function readString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function readBoolean(value) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const text = value.trim().toLowerCase()
    return text === 'true' || text === '1' || text === 'yes'
  }
  return false
}

function readNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function readArray(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean)
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean)
  return []
}

function readObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function extractYear(...values) {
  for (const value of values) {
    const match = String(value || '').match(/(?:19|20)\d{2}/)
    if (!match) continue
    const parsed = Number(match[0])
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

function readTime(...values) {
  for (const value of values) {
    const text = String(value || '').trim()
    if (!text) continue
    const parsed = Date.parse(text)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

function normalizeSlug(value) {
  return String(value || '').trim().replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/')
}

function contentDirFromIndexPath(filePath) {
  return normalizePath(path.relative(CONTENT_ROOT, path.dirname(filePath)))
}

function hrefOf(slug) {
  return slug === 'home' ? '/' : `/${slug}`
}

function inferCategory(frontmatter, contentDir) {
  const exposure = readObject(frontmatter.exposure)
  const direct = readString(frontmatter.category) || readString(frontmatter.kind) || readString(frontmatter.type) || readString(exposure.category) || readString(exposure.kind)
  if (direct) return direct
  if (contentDir.startsWith('works/') || contentDir === 'works') return 'work'
  if (contentDir.startsWith('posts/')) return 'post'
  if (contentDir.startsWith('lab/')) return 'lab'
  if (contentDir.startsWith('tools/')) return 'tool'
  if (contentDir.startsWith('docs/')) return 'doc'
  return 'page'
}

function buildEntry(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')
  const frontmatter = readFrontmatter(raw)
  const contentDir = contentDirFromIndexPath(filePath)
  const exposure = readObject(frontmatter.exposure)
  const work = readObject(frontmatter.work)
  const slug = normalizeSlug(frontmatter.slug || contentDir)
  const category = inferCategory(frontmatter, contentDir)
  const kind = readString(frontmatter.kind) || readString(frontmatter.type) || category
  const collection = readString(frontmatter.collection) || readString(exposure.collection) || kind
  const title = readString(frontmatter.cardTitle) || readString(frontmatter.title) || slug
  const description = readString(frontmatter.cardDescription) || readString(frontmatter.summary) || readString(frontmatter.description)
  const cover = readString(frontmatter.cardCover) || readString(frontmatter.thumbnail) || readString(frontmatter.cover) || readString(frontmatter.ogImage)
  const status = readString(exposure.status) || readString(frontmatter.status) || 'active'
  const visibility = readString(exposure.visibility) || readString(frontmatter.visibility) || 'public'
  const year = extractYear(frontmatter.date, frontmatter.publishedDate, frontmatter.updated, slug)
  const time = readTime(frontmatter.publishedDate, frontmatter.date, frontmatter.updated, frontmatter.created)
  const hasWorkMetadata = Object.keys(work).length > 0 || category === 'work' || category === 'case-study' || kind === 'work' || kind === 'case-study'

  return {
    slug,
    href: hrefOf(slug),
    contentDir,
    title,
    description,
    category,
    categoryLabel: readString(frontmatter.categoryLabel) || category,
    kind,
    collection,
    tags: readArray(frontmatter.tags),
    order: readNumber(frontmatter.order, 9999),
    featured: readBoolean(frontmatter.featured) || readBoolean(exposure.featured) || readBoolean(work.featured),
    visibility,
    status,
    cover,
    thumbnail: readString(frontmatter.thumbnail) || cover,
    ...(year ? { year } : {}),
    ...(time ? { time } : {}),
    work: {
      hasWorkMetadata,
      status: readString(work.status) || status,
      role: readArray(work.role ?? frontmatter.role),
      stack: readArray(work.stack ?? frontmatter.stack),
      period: readString(work.period) || readString(frontmatter.period),
      type: readString(work.type) || kind,
    },
  }
}

function assertNoHeavyKeys(value, trail = []) {
  if (!value || typeof value !== 'object') return
  for (const [key, child] of Object.entries(value)) {
    if (key === 'raw' || key === 'html' || key === 'headings') {
      throw new Error(`forbidden heavy key ${[...trail, key].join('.')}`)
    }
    assertNoHeavyKeys(child, [...trail, key])
  }
}

const entries = walkIndexMarkdown(CONTENT_ROOT)
  .map(buildEntry)
  .filter((entry) => entry.slug)
  .sort((a, b) => a.order - b.order || String(b.time || 0).localeCompare(String(a.time || 0)) || a.slug.localeCompare(b.slug))

let payload = {
  schemaVersion: SCHEMA_VERSION,
  generatedAt: new Date().toISOString(),
  entries,
}

assertNoHeavyKeys(payload)

if (CHECK) {
  const current = fs.existsSync(OUT_PATH) ? fs.readFileSync(OUT_PATH, 'utf8') : ''
  let currentPayload = null
  try {
    currentPayload = current ? JSON.parse(current) : null
  } catch {
    currentPayload = null
  }
  if (currentPayload?.generatedAt) {
    payload = { ...payload, generatedAt: currentPayload.generatedAt }
  }
  const next = `${JSON.stringify(payload, null, 2)}\n`
  if (current !== next) {
    console.error('[PUBLIC-ASSET-SSOT-04M-B3] homeCollections.generated.json is stale')
    process.exit(1)
  }
  console.log('PASS_PUBLIC_ASSET_SSOT_04M_B3_HOME_COLLECTIONS_CHECK')
} else {
  const next = `${JSON.stringify(payload, null, 2)}\n`
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
  fs.writeFileSync(OUT_PATH, next, 'utf8')
  console.log(`WROTE ${normalizePath(path.relative(ROOT, OUT_PATH))} (${entries.length} entries)`)
}
