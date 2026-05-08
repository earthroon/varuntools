#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { buildAndWritePageSearchIndex, buildAndWriteInternalDocsSearchIndex, normalizePageSearchText } from './lib/page-search-index.mjs'
import { buildAndWritePortfolioSeo } from './lib/portfolio-seo.mjs'

const root = process.cwd()
const checks = []
function check(name, condition) { checks.push([name, Boolean(condition)]) }
function read(file) { return readFileSync(path.join(root, file), 'utf8') }
function exists(file) { return existsSync(path.join(root, file)) }

const pkg = JSON.parse(read('package.json'))
const result = buildAndWritePageSearchIndex({ projectRoot: root })
const internalResult = buildAndWriteInternalDocsSearchIndex({ projectRoot: root })
buildAndWritePortfolioSeo({ projectRoot: root, origin: 'https://varun.tools' })

const indexPath = 'src/content/generated/page-search-index.json'
const index = JSON.parse(read(indexPath))
const internalIndex = JSON.parse(read('src/content/generated/internal-docs-search-index.json'))
const router = read('src/router/index.ts')
const searchPage = read('src/pages/SearchPage.vue')
const panel = read('src/components/search/PageSearchPanel.vue')
const results = read('src/components/search/PageSearchResults.vue')
const pageSearchTs = read('src/utils/pageSearch.ts')
const usePageSearch = read('src/composables/usePageSearch.ts')
const lib = read('scripts/lib/page-search-index.mjs')
const launch = read('scripts/check-launch.mjs')
const sitemap = read('public/sitemap.xml')
const seoManifest = JSON.parse(read('src/content/generated/portfolio-seo-manifest.json'))

check('build:page-search script exists', pkg.scripts?.['build:page-search'] === 'node scripts/build-page-search-index.mjs')
check('smoke:page-search script exists', pkg.scripts?.['smoke:page-search'] === 'node scripts/smoke-page-search.mjs')
check('page-search-index lib exists', exists('scripts/lib/page-search-index.mjs'))
check('build script exists', exists('scripts/build-page-search-index.mjs'))
check('generated index exists', exists(indexPath))
check('index version is 1', index.version === 1)
check('pages array exists', Array.isArray(index.pages))
check('summary exists', index.summary && typeof index.summary.total === 'number')
check('content templates may be public pages when inventory allows them', index.pages.some((entry) => entry.href === '/products/categories/templates'))
check('generated excluded', !index.pages.some((entry) => entry.sourcePath.includes('/generated/') || entry.sourcePath.includes('src/content/generated')))
check('draft/private/hidden excluded', !index.pages.some((entry) => ['draft', 'private', 'hidden'].includes(String(entry.status || '').toLowerCase()) || entry.indexable === false))
check('work page is indexed as work', index.pages.some((entry) => entry.type === 'work'))
check('authoring docs are excluded from public index', !index.pages.some((entry) => entry.type === 'doc' || entry.sourcePath.startsWith('docs/authoring/')))
check('internal docs index exists', exists('src/content/generated/internal-docs-search-index.json'))
check('internal docs index includes authoring docs', internalIndex.pages.some((entry) => entry.sourcePath.startsWith('docs/authoring/')))
check('internal docs index includes migration docs', internalIndex.pages.some((entry) => entry.sourcePath.startsWith('docs/migration/')))
check('internal docs index includes bake reports', internalIndex.pages.some((entry) => entry.sourcePath.startsWith('BAKE_REPORT_COMMIT_')))
check('product pages are indexed as product', index.pages.some((entry) => entry.type === 'product'))
check('normalize keeps Korean text', normalizePageSearchText('작성 가이드 색감').includes('작성 가이드'))
check('title/body search material exists', index.pages.some((entry) => `${entry.title} ${entry.text}`.toLowerCase().includes('portfolio') || `${entry.title} ${entry.text}`.includes('포트폴리오')))
check('tag/keyword search material exists', index.pages.some((entry) => [...entry.tags, ...entry.keywords].length > 0))
check('/search route exists', router.includes("path: '/search'") && router.includes("name: 'search'"))
check('SearchPage exists', exists('src/pages/SearchPage.vue'))
check('PageSearchPanel exists', exists('src/components/search/PageSearchPanel.vue'))
check('PageSearchResults exists', exists('src/components/search/PageSearchResults.vue'))
check('SearchPage uses query composable', searchPage.includes('usePageSearch'))
check('Search panel has accessible input', panel.includes('type="search"') && panel.includes('aria-describedby'))
check('Search results has empty state', results.includes('검색 결과가 없습니다') && results.includes('vt-page-search__empty'))
check('pageSearch.ts has scoring', pageSearchTs.includes('scorePageSearchEntry') && pageSearchTs.includes('matchedFields'))
check('pageSearch.ts has type priority', pageSearchTs.includes('TYPE_PRIORITY'))
check('usePageSearch imports generated JSON', usePageSearch.includes('page-search-index.json'))
check('/search q query sync exists', usePageSearch.includes('route.query.q') && usePageSearch.includes('router.replace'))
check('check-launch runs build page search', launch.includes('scripts/build-page-search-index.mjs'))
check('check-launch runs smoke page search', launch.includes('scripts/smoke-page-search.mjs'))
check('SEO manifest includes search page', seoManifest.pages.some((entry) => entry.href === '/search' && entry.indexable))
check('sitemap includes /search', sitemap.includes('https://varun.tools/search'))
check('sitemap excludes search query URLs', !sitemap.includes('/search?q='))
check('source contains no object leakage', !`${read(indexPath)}\n${searchPage}\n${panel}\n${results}`.includes('[object Object]'))
check('build result matches generated index', result.index.version === 1 && result.index.pages.length === index.pages.length)
check('internal build result matches generated index', internalResult.index.version === 1 && internalResult.index.pages.length === internalIndex.pages.length)

const failed = checks.filter(([, ok]) => !ok)
if (failed.length) {
  for (const [name] of failed) console.error(`[smoke:page-search] FAIL ${name}`)
  process.exit(1)
}
console.log(`[smoke:page-search] OK - ${checks.length} checks`)
