import fs from 'node:fs'

const loader = fs.readFileSync('src/markdown/lazyMarkdownPageLoader.ts', 'utf8')
const page = fs.readFileSync('src/pages/MarkdownPage.vue', 'utf8')
const workCard = fs.readFileSync('src/components/markdown/WorkCard.vue', 'utf8')
const navLink = fs.readFileSync('src/components/layout/SiteNavigationLink.vue', 'utf8')
const grid = fs.readFileSync('src/components/content/ContentCollectionGrid.vue', 'utf8')
const app = fs.readFileSync('src/App.vue', 'utf8')

function fail(message) {
  console.error('FAIL_VT_UI_14D_SYNCHRONOUS_MARKDOWN_CACHE_HYDRATION')
  console.error(message)
  process.exit(1)
}

function mustInclude(text, token, message) {
  if (!text.includes(token)) fail(message)
}

mustInclude(loader, 'export function readCachedMarkdownPageBySlug', 'lazyMarkdownPageLoader.ts missing sync cache read export')
mustInclude(loader, 'pageCache.get(slug)', 'readCachedMarkdownPageBySlug must read pageCache synchronously')
mustInclude(page, 'readCachedMarkdownPageBySlug', 'MarkdownPage.vue missing sync cache hydration import/use')
mustInclude(page, 'initialCachedPage', 'MarkdownPage.vue missing initial cached page hydration')
mustInclude(page, 'readCachedMarkdownPageBySlug(nextSlug)', 'MarkdownPage.vue missing watch-time sync cache read')

mustInclude(workCard, '@pointerdown=', 'WorkCard.vue missing pointerdown warmup')
mustInclude(navLink, '@pointerdown=', 'SiteNavigationLink.vue missing pointerdown warmup')

if (
  !grid.includes('useViewportInternalLinkPrefetch') &&
  !grid.includes('prewarm') &&
  !grid.includes('warmInternalHref')
) {
  fail('ContentCollectionGrid.vue missing viewport/public content prewarm path')
}

if (app.includes(':key="route.fullPath"') || app.includes(':key="currentRouteKey"')) {
  fail('App.vue reintroduced route keyed RouterView')
}

const loadingClearPattern = /loadState\.value\s*=\s*['"]loading['"][\s\S]{0,160}page\.value\s*=\s*null/
if (loadingClearPattern.test(page)) {
  fail('MarkdownPage.vue reintroduced page clear during loading')
}

console.log('PASS_VT_UI_14D_SYNCHRONOUS_MARKDOWN_CACHE_HYDRATION')
