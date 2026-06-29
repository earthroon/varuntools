import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const ROOT = process.cwd()
const CONTENT_ROOT = path.join(ROOT, 'src', 'content', 'pages')
const OUT_FILE = path.join(ROOT, 'src', 'markdown', 'markdownRouteIndex.generated.ts')

function toPosixPath(value) {
  return String(value || '').replace(/\\/g, '/')
}

function normalizeSlug(value) {
  return String(value || '').trim().replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/')
}

function stripQuotes(value) {
  return String(value || '').trim().replace(/^['"]|['"]$/g, '').trim()
}

function readSlugFromFrontmatter(source, fallback) {
  const normalized = String(source || '').replace(/^\uFEFF/, '')
  if (!normalized.startsWith('---')) return fallback

  const end = normalized.indexOf('\n---', 3)
  if (end < 0) return fallback

  const frontmatter = normalized.slice(3, end)
  const match = frontmatter.match(/^slug:\s*([^\r\n#]+?)\s*$/m)
  if (!match) return fallback

  return normalizeSlug(stripQuotes(match[1])) || fallback
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full, out)
      continue
    }

    if (entry.isFile() && entry.name === 'index.md') {
      out.push(full)
    }
  }

  return out
}

function buildEntries() {
  const files = walk(CONTENT_ROOT)
  const bySlug = new Map()

  for (const file of files) {
    const relativeDir = toPosixPath(path.relative(CONTENT_ROOT, path.dirname(file)))
    const contentDir = normalizeSlug(relativeDir)
    if (!contentDir) continue

    const source = fs.readFileSync(file, 'utf8')
    const slug = readSlugFromFrontmatter(source, contentDir)
    if (!slug) continue

    bySlug.set(slug, {
      slug,
      contentDir,
      source: 'content',
      priority: 0,
    })
  }

  return [...bySlug.values()].sort((a, b) => a.slug.localeCompare(b.slug))
}

function toTsString(value) {
  return JSON.stringify(value)
}

function render(entries) {
  const rows = entries.map((entry) => [
    '  {',
    `    slug: ${toTsString(entry.slug)},`,
    `    contentDir: ${toTsString(entry.contentDir)},`,
    `    source: ${toTsString(entry.source)},`,
    `    priority: ${Number(entry.priority) || 0},`,
    '  },',
  ].join('\n')).join('\n')

  return `export type MarkdownRouteIndexEntry = {\n` +
    `  slug: string\n` +
    `  contentDir: string\n` +
    `  source: 'content' | 'vacms-live'\n` +
    `  priority: number\n` +
    `}\n\n` +
    `export const markdownRouteIndexEntries: MarkdownRouteIndexEntry[] = [\n` +
    `${rows}${rows ? '\n' : ''}` +
    `]\n`
}

function main() {
  const check = process.argv.includes('--check')
  const entries = buildEntries()
  const next = render(entries)

  if (check) {
    const current = fs.existsSync(OUT_FILE) ? fs.readFileSync(OUT_FILE, 'utf8') : ''
    if (current !== next) {
      console.error('[PUBLIC-ASSET-SSOT-04M-B2] markdownRouteIndex.generated.ts is stale')
      console.error('Run: node scripts/build-markdown-route-index.mjs')
      process.exit(1)
    }
    console.log('PASS_PUBLIC_ASSET_SSOT_04M_B2_MARKDOWN_ROUTE_INDEX_FRESH')
    return
  }

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true })
  fs.writeFileSync(OUT_FILE, next, 'utf8')
  console.log(`[PUBLIC-ASSET-SSOT-04M-B2] wrote ${toPosixPath(path.relative(ROOT, OUT_FILE))}`)
  console.log(`[PUBLIC-ASSET-SSOT-04M-B2] entries ${entries.length}`)
}

main()
