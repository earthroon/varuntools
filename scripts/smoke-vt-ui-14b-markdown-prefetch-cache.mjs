import fs from 'node:fs'

const loader = fs.readFileSync('src/markdown/lazyMarkdownPageLoader.ts', 'utf8')
const helper = fs.readFileSync('src/markdown/markdownNavigationPrefetch.ts', 'utf8')
const navLink = fs.readFileSync('src/components/layout/SiteNavigationLink.vue', 'utf8')
const app = fs.readFileSync('src/App.vue', 'utf8')
const markdownPage = fs.readFileSync('src/pages/MarkdownPage.vue', 'utf8')

function fail(message) {
  console.error('FAIL_VT_UI_14B_HEADER_NAVIGATION_MARKDOWN_PREFETCH_CACHE')
  console.error(message)
  process.exit(1)
}

function mustInclude(text, token, message) {
  if (!text.includes(token)) fail(message)
}

mustInclude(loader, 'const pageCache = new Map<string, LoadedMarkdownPage>()', 'lazyMarkdownPageLoader.ts missing pageCache Map')
mustInclude(loader, 'const pendingLoads = new Map<string, Promise<LoadedMarkdownPage | null>>()', 'lazyMarkdownPageLoader.ts missing pendingLoads Map')
mustInclude(loader, 'const cached = pageCache.get(slug)', 'loadMarkdownPageBySlug missing cache hit path')
mustInclude(loader, 'const pending = pendingLoads.get(slug)', 'loadMarkdownPageBySlug missing pending dedupe read')
mustInclude(loader, 'if (pending) return pending', 'loadMarkdownPageBySlug lacks pending dedupe check')
mustInclude(loader, 'pendingLoads.set(slug, pendingLoad)', 'loadMarkdownPageBySlug missing pending dedupe write')
mustInclude(loader, 'pendingLoads.delete(slug)', 'loadMarkdownPageBySlug missing pending cleanup')
mustInclude(loader, 'if (loaded) pageCache.set(slug, loaded)', 'loadMarkdownPageBySlug missing loaded cache write')
mustInclude(loader, 'export function prefetchMarkdownPageBySlug', 'lazyMarkdownPageLoader.ts missing prefetch export')
mustInclude(loader, 'return loadMarkdownPageBySlug(rawSlug).catch(() => null)', 'prefetch must swallow failures')

mustInclude(helper, 'prefetchMarkdownPageBySlug', 'markdownNavigationPrefetch helper missing loader prefetch call')
mustInclude(helper, 'export function markdownNavigationPrefetch', 'markdownNavigationPrefetch export missing')
mustInclude(helper, 'externalHrefPattern', 'helper missing external href guard')

mustInclude(navLink, 'markdownNavigationPrefetch', 'SiteNavigationLink.vue missing shared prefetch helper')
mustInclude(navLink, 'function warmNavigationTarget', 'SiteNavigationLink.vue missing warmNavigationTarget function')
mustInclude(navLink, '@pointerenter="warmNavigationTarget"', 'SiteNavigationLink.vue missing pointerenter warmup')
mustInclude(navLink, '@focus="warmNavigationTarget"', 'SiteNavigationLink.vue missing focus warmup')
mustInclude(navLink, '@click="warmNavigationTarget"', 'SiteNavigationLink.vue missing click warmup')

if (app.includes('v-slot') && app.includes('RouterView')) {
  fail('App.vue reintroduced RouterView slot remount')
}

if (app.includes(':key="route.fullPath"') || app.includes(':key="currentRouteKey"')) {
  fail('App.vue reintroduced route keyed RouterView')
}

if (/loadState\.value = 'loading'\s*\r?\n\s*loadError\.value = ''\s*\r?\n\s*page\.value = null/.test(markdownPage)) {
  fail('MarkdownPage.vue reintroduced page clear during loading')
}

console.log('PASS_VT_UI_14B_HEADER_NAVIGATION_MARKDOWN_PREFETCH_CACHE')
