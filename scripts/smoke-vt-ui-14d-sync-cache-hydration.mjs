import fs from 'node:fs'

const loader = fs.readFileSync('src/markdown/lazyMarkdownPageLoader.ts', 'utf8')
const markdownPage = fs.readFileSync('src/pages/MarkdownPage.vue', 'utf8')
const helper = fs.readFileSync('src/markdown/markdownNavigationPrefetch.ts', 'utf8')
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

mustInclude(loader, 'export function readCachedMarkdownPageBySlug', 'loader missing sync cache read export')
mustInclude(loader, 'pageCache.get(slug)', 'sync cache read must use pageCache.get(slug)')
if (/async function readCachedMarkdownPageBySlug/.test(loader)) fail('readCachedMarkdownPageBySlug must not be async')

mustInclude(markdownPage, 'readCachedMarkdownPageBySlug', 'MarkdownPage.vue missing sync cache read import/use')
mustInclude(markdownPage, 'const initialCachedPage = readCachedMarkdownPageBySlug(slug.value)', 'MarkdownPage.vue missing initial cached page hydrate')
mustInclude(markdownPage, 'shallowRef<LoadedMarkdownPage | null>(initialCachedPage)', 'MarkdownPage.vue missing cached page initial ref')
mustInclude(markdownPage, "initialCachedPage ? 'ready' : 'idle'", 'MarkdownPage.vue missing cache-aware initial loadState')
mustInclude(markdownPage, 'const cachedPage = readCachedMarkdownPageBySlug(nextSlug)', 'MarkdownPage.vue missing watch-time sync cache hydrate')
mustInclude(markdownPage, 'if (cachedPage)', 'MarkdownPage.vue missing watch-time cache hit branch')

mustInclude(helper, 'export function prewarmMarkdownNavigationHrefs', 'helper missing href list prewarm export')
mustInclude(helper, 'warmMarkdownNavigationTarget', 'helper missing compatibility warm alias')

mustInclude(workCard, '@pointerdown="warmCardTarget"', 'WorkCard.vue missing pointerdown warmup')
mustInclude(navLink, '@pointerdown="warmNavigationTarget"', 'SiteNavigationLink.vue missing pointerdown warmup')

mustInclude(grid, 'prewarmMarkdownNavigationHrefs', 'ContentCollectionGrid.vue missing public content prewarm helper')
mustInclude(grid, 'PUBLIC_CONTENT_PREWARM_LIMIT = 8', 'ContentCollectionGrid.vue missing bounded prewarm limit')
mustInclude(grid, 'schedulePublicContentPrewarm', 'ContentCollectionGrid.vue missing scheduled prewarm')
if (!grid.includes('requestIdleCallback') && !grid.includes('setTimeout')) fail('ContentCollectionGrid.vue missing idle/timeout prewarm scheduling')

if (app.includes('v-slot') && app.includes('RouterView')) fail('App.vue reintroduced RouterView slot remount')
if (app.includes(':key="route.fullPath"') || app.includes(':key="currentRouteKey"')) fail('App.vue reintroduced route keyed RouterView')
if (/loadState\.value = 'loading'\s*\r?\n\s*loadError\.value = ''\s*\r?\n\s*page\.value = null/.test(markdownPage)) {
  fail('MarkdownPage.vue reintroduced page clear during loading')
}

console.log('PASS_VT_UI_14D_SYNCHRONOUS_MARKDOWN_CACHE_HYDRATION')
