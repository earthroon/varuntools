#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { spawnSync } from 'node:child_process'

const ROOT = process.cwd()
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8')
const exists = (rel) => fs.existsSync(path.join(ROOT, rel))
const checks = []
function check(name, ok, detail = '') { checks.push({ name, ok: Boolean(ok), detail }) }

const featured = read('src/components/markdown/FeaturedWorksGrid.vue')
const loader = read('src/markdown/lazyMarkdownPageLoader.ts')
const mount = read('src/markdown/useMarkdownComponentMount.ts')
const packageJson = read('package.json')
const committer = read('scripts/commit-vacms-public-page-transaction.mjs')
const routeIndex = read('src/markdown/markdownRouteIndex.generated.ts')

check('manual cards directly load exact markdown targets', featured.includes('loadMarkdownPageBySlug') && featured.includes('resolveManualItem'))
check('stale target fallback is migration-only and unique-title bound', featured.includes('loadAllMarkdownPages') && featured.includes('normalizeMigrationTitleIdentity') && featured.includes('titleMatches.length === 1'))
check('manual card slots do not collapse while target metadata loads', featured.includes("'loading'") && featured.includes('manualEntries.value = items.map'))
check('missing target remains observable', featured.includes("'missing'") && featured.includes('data-featured-resolution'))
check('global pages hydration does not own markdown island remount', !mount.includes('() => options.pages.value'))
check('physical module union loader remains available', loader.includes('markdownContentDirsFromModules') && loader.includes('new Set([...routeKeys, ...moduleKeys])'))

const buildNeedle = 'npm run build:public-assets && node scripts/build-markdown-route-index.mjs && node scripts/build-markdown-route-index.mjs --check && node scripts/build-home-collections.mjs'
check('normal build regenerates route index after public projection/assets', packageJson.includes(buildNeedle))
check('VACMS commit transaction owns derived route index', committer.includes("const ROUTE_INDEX_PATH = 'src/markdown/markdownRouteIndex.generated.ts'") && committer.includes('materializationPaths') && committer.includes('...materializationPaths, ROUTE_INDEX_PATH'))
check('VACMS commit transaction regenerates route index before exact staging', committer.includes("['scripts/build-markdown-route-index.mjs']") && committer.includes("['scripts/build-markdown-route-index.mjs', '--check']"))

const indexCheck = spawnSync(process.execPath, ['scripts/build-markdown-route-index.mjs', '--check'], {
  cwd: ROOT,
  encoding: 'utf8',
  shell: false,
})
check('generated route index is fresh against physical content', indexCheck.status === 0, [indexCheck.stdout, indexCheck.stderr].filter(Boolean).join('\n').trim())

for (const slug of ['post/portfolio', 'post/printtest', 'post/diecut']) {
  const physical = `src/content/pages/${slug}/index.md`
  if (!exists(physical)) continue
  check(`route index contains ${slug}`, routeIndex.includes(`slug: "${slug}"`))
}

const portfolioPath = 'src/content/pages/post/portfolio/index.md'
if (exists(portfolioPath)) {
  const portfolio = read(portfolioPath)
  if (portfolio.includes('/page/diecut')) {
    console.warn('WARN CMS-118-R1A-R2 canonical source migration still pending: /page/diecut -> /post/diecut')
  }
}

let failed = 0
for (const item of checks) {
  console.log(`${item.ok ? 'PASS' : 'FAIL'} ${item.name}${item.detail ? ` :: ${item.detail}` : ''}`)
  if (!item.ok) failed += 1
}
if (failed) {
  console.error(`CMS-118-R1A-R2 PUBLIC smoke FAILED (${failed})`)
  process.exit(1)
}
console.log('PASS_CMS_118_R1A_R2_FEATURED_MATERIALIZATION')
