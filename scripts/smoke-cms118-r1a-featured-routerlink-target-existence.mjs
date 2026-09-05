#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const ROOT = process.cwd()
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8')
const checks = []
function check(name, ok, detail = '') { checks.push({ name, ok: Boolean(ok), detail }) }

const work = read('src/components/markdown/WorkCard.vue')
const featured = read('src/components/markdown/FeaturedWorksGrid.vue')
const loader = read('src/markdown/lazyMarkdownPageLoader.ts')

check('internal WorkCard delegates execution to RouterLink', work.includes("import { RouterLink } from 'vue-router'") && work.includes(":is=\"isInternal ? RouterLink : 'a'\""))
check('manual preventDefault navigation is retired', !work.includes('event.preventDefault()') && !work.includes('router.push(') && !work.includes('useRouter'))
check('external/anchor WorkCard retains native href branch', work.includes(":href=\"isInternal ? undefined : safeHref\"") && work.includes("noopener noreferrer"))
check('FeaturedWorks resolves against complete page registry', featured.includes('props.pages.map(toWorkCardEntry)') && featured.includes('resolveManualRegistryEntry'))
check('stale internal href may canonicalize only through a unique registry identity', featured.includes('titleMatches.length === 1') && featured.includes('registryEntry.href'))
check('all-pages loader includes physical markdown modules, not generated index only', loader.includes('markdownContentDirsFromModules') && loader.includes('Object.keys(markdownModules)') && loader.includes('new Set([...routeKeys, ...moduleKeys])'))

function walk(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? walk(full) : [full]
  })
}
function frontmatterValue(source, key) {
  const normalized = source.replace(/^\uFEFF/u, '')
  if (!normalized.startsWith('---')) return ''
  const end = normalized.indexOf('\n---', 3)
  if (end < 0) return ''
  const fm = normalized.slice(3, end)
  const match = new RegExp(`^${key}:\\s*[\"']?([^\"'\\r\\n#]+)[\"']?\\s*$`, 'm').exec(fm)
  return String(match?.[1] || '').trim()
}
function normalizeText(value) { return String(value || '').trim().replace(/\s+/gu, ' ').toLowerCase() }
const pages = walk(path.join(ROOT, 'src/content/pages'))
  .filter((file) => file.endsWith(`${path.sep}index.md`))
  .map((file) => {
    const source = fs.readFileSync(file, 'utf8')
    return { slug: frontmatterValue(source, 'slug'), title: frontmatterValue(source, 'title') }
  })
  .filter((page) => page.slug)

const portfolioPath = path.join(ROOT, 'src/content/pages/post/portfolio/index.md')
if (fs.existsSync(portfolioPath)) {
  const portfolio = fs.readFileSync(portfolioPath, 'utf8')
  const itemsLine = portfolio.split(/\r?\n/u).find((line) => line.startsWith('items: ')) || ''
  const rawItems = itemsLine.slice('items: '.length).split(',').map((value) => value.trim()).filter(Boolean)
  for (const raw of rawItems) {
    const [, title = '', href = ''] = raw.split('|').map((value) => value.trim())
    if (!href.startsWith('/')) continue
    const slug = href.replace(/^\/+|\/+$/gu, '')
    const exact = pages.find((page) => page.slug === slug)
    if (exact) {
      check(`featured internal target exists: ${href}`, true)
      continue
    }
    const matches = pages.filter((page) => normalizeText(page.title) === normalizeText(title))
    check(`stale featured target has one canonical title match: ${href}`, matches.length === 1, matches.map((page) => page.slug).join(','))
  }
}

let failed = 0
for (const item of checks) {
  console.log(`${item.ok ? 'PASS' : 'FAIL'} ${item.name}${item.detail ? ` :: ${item.detail}` : ''}`)
  if (!item.ok) failed += 1
}
if (failed) {
  console.error(`CMS-118-R1A PUBLIC smoke FAILED (${failed})`)
  process.exit(1)
}
console.log('PASS_CMS_118_R1A_PUBLIC_ROUTERLINK_AND_TARGET_EXISTENCE')
