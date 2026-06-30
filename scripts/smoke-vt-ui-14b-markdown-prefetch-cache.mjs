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

if (!helper.includes('prefetchMarkdownPageBySlug') && !helper.includes('warmMarkdownNavigationTarget')) {
  fail('markdownNavigationPrefetch helper missing markdown prefetch bridge')
}

if (!helper.includes('externalHrefPattern') && !helper.includes('isBrowserHandledHref')) {
  fail('helper missing external href guard')
}

if (
  !navLink.includes('markdownNavigationPrefetch') &&
  !navLink.includes('warmMarkdownNavigationTarget') &&
  !navLink.includes('useInternalSpaNavigation') &&
  !navLink.includes('prefetchRouteTarget')
) {
  fail('SiteNavigationLink.vue missing shared route/markdown prefetch bridge')
}

mustInclude(navLink, '@pointerenter=', 'SiteNavigationLink.vue missing pointerenter warmup')
mustInclude(navLink, '@focus=', 'SiteNavigationLink.vue missing focus warmup')
mustInclude(navLink, '@click=', 'SiteNavigationLink.vue missing click navigation handler')

if (app.includes(':key="route.fullPath"') || app.includes(':key="currentRouteKey"')) {
  fail('App.vue reintroduced route keyed RouterView')
}

const loadingClearPattern = /loadState\.value\s*=\s*['"]loading['"][\s\S]{0,160}page\.value\s*=\s*null/
if (loadingClearPattern.test(markdownPage)) {
  fail('MarkdownPage.vue reintroduced page clear during loading')
}

console.log('PASS_VT_UI_14B_HEADER_NAVIGATION_MARKDOWN_PREFETCH_CACHE')
