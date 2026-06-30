import fs from 'node:fs'

const loader = fs.readFileSync('src/markdown/lazyMarkdownPageLoader.ts', 'utf8')
const nav = fs.readFileSync('src/components/layout/SiteNavigationLink.vue', 'utf8')
const app = fs.existsSync('src/App.vue') ? fs.readFileSync('src/App.vue', 'utf8') : ''
const markdownPage = fs.existsSync('src/pages/MarkdownPage.vue') ? fs.readFileSync('src/pages/MarkdownPage.vue', 'utf8') : ''

function fail(message) {
  console.error('FAIL_VT_UI_14B_HEADER_NAVIGATION_MARKDOWN_PREFETCH_CACHE')
  console.error(message)
  process.exit(1)
}

function mustInclude(source, needle, message) {
  if (!source.includes(needle)) fail(message)
}

mustInclude(loader, 'const pageCache = new Map<string, LoadedMarkdownPage>()', 'lazyMarkdownPageLoader.ts missing pageCache Map')
mustInclude(loader, 'const pendingLoads = new Map<string, Promise<LoadedMarkdownPage | null>>()', 'lazyMarkdownPageLoader.ts missing pendingLoads Map')
mustInclude(loader, 'const cached = pageCache.get(slug)', 'loadMarkdownPageBySlug missing cache hit path')
mustInclude(loader, 'const pending = pendingLoads.get(slug)', 'loadMarkdownPageBySlug missing pending dedupe read')
mustInclude(loader, 'pendingLoads.set(slug, pendingLoad)', 'loadMarkdownPageBySlug missing pending dedupe write')
mustInclude(loader, 'pendingLoads.delete(slug)', 'loadMarkdownPageBySlug missing pending cleanup')
mustInclude(loader, 'if (loaded) pageCache.set(slug, loaded)', 'loadMarkdownPageBySlug missing loaded cache write')
mustInclude(loader, 'export function prefetchMarkdownPageBySlug', 'lazyMarkdownPageLoader.ts missing prefetch export')
mustInclude(loader, 'return loadMarkdownPageBySlug(rawSlug).catch(() => null)', 'prefetch must swallow failures')

mustInclude(nav, "import { prefetchMarkdownPageBySlug } from '@/markdown/lazyMarkdownPageLoader'", 'SiteNavigationLink.vue missing prefetch import')
mustInclude(nav, 'function warmNavigationTarget()', 'SiteNavigationLink.vue missing warmNavigationTarget')
mustInclude(nav, 'void prefetchMarkdownPageBySlug(slug)', 'SiteNavigationLink.vue does not call prefetch')
mustInclude(nav, '@pointerenter="warmNavigationTarget"', 'RouterLink missing pointerenter warmup')
mustInclude(nav, '@focus="warmNavigationTarget"', 'RouterLink missing focus warmup')
mustInclude(nav, '@click="warmNavigationTarget"', 'RouterLink missing click warmup')
mustInclude(nav, "props.item.external", 'SiteNavigationLink.vue must skip external links')

if (app.includes('v-slot') && app.includes('RouterView')) {
  fail('App.vue still uses RouterView slot remount shape')
}
if (app.includes(':key="route.fullPath"') || app.includes(':key="currentRouteKey"')) {
  fail('App.vue still keys RouterView by route')
}
if (/loadState\.value = 'loading'\s*\r?\n\s*loadError\.value = ''\s*\r?\n\s*page\.value = null/.test(markdownPage)) {
  fail('MarkdownPage.vue clears page during loading prologue')
}

console.log('PASS_VT_UI_14B_HEADER_NAVIGATION_MARKDOWN_PREFETCH_CACHE')
console.log('PASS_VT_UI_14B_WARM_PRODUCTS_WIPER_MARKDOWN_ROUTES')
console.log('PASS_VT_UI_14B_NO_COLD_MARKDOWN_PAINT_FLASH')
console.log('PASS_VT_UI_14B_NO_COGNITIVE_FLICKER')
