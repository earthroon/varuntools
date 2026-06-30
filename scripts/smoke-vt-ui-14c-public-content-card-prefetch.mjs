import fs from 'node:fs'

const helper = fs.readFileSync('src/markdown/markdownNavigationPrefetch.ts', 'utf8')
const loader = fs.readFileSync('src/markdown/lazyMarkdownPageLoader.ts', 'utf8')
const workCard = fs.readFileSync('src/components/markdown/WorkCard.vue', 'utf8')
const navLink = fs.readFileSync('src/components/layout/SiteNavigationLink.vue', 'utf8')
const app = fs.readFileSync('src/App.vue', 'utf8')
const markdownPage = fs.readFileSync('src/pages/MarkdownPage.vue', 'utf8')

function fail(message) {
  console.error('FAIL_VT_UI_14C_PUBLIC_CONTENT_CARD_MARKDOWN_PREFETCH')
  console.error(message)
  process.exit(1)
}

function mustInclude(text, token, message) {
  if (!text.includes(token)) fail(message)
}

mustInclude(helper, 'prefetchMarkdownPageBySlug', 'helper does not use markdown prefetch loader')
mustInclude(loader, 'const pageCache = new Map<string, LoadedMarkdownPage>()', 'loader missing pageCache Map')
mustInclude(loader, 'const pendingLoads = new Map<string, Promise<LoadedMarkdownPage | null>>()', 'loader missing pendingLoads Map')
mustInclude(loader, 'const pending = pendingLoads.get(slug)', 'loader missing pending dedupe read')
mustInclude(loader, 'if (pending) return pending', 'loader lacks pending dedupe check')
mustInclude(loader, 'pendingLoads.set(slug, pendingLoad)', 'loader missing pending dedupe write')
mustInclude(loader, 'pendingLoads.delete(slug)', 'loader missing pending cleanup')
mustInclude(loader, 'export function prefetchMarkdownPageBySlug', 'loader missing prefetch export')

if (
  !workCard.includes('markdownNavigationPrefetch') &&
  !workCard.includes('warmMarkdownNavigationTarget') &&
  !workCard.includes('useInternalSpaNavigation')
) {
  fail('WorkCard.vue does not use shared prefetch/navigation helper')
}

mustInclude(workCard, '@pointerenter=', 'WorkCard.vue missing pointerenter warmup')
mustInclude(workCard, '@focus=', 'WorkCard.vue missing focus warmup')
mustInclude(workCard, '@pointerdown=', 'WorkCard.vue missing pointerdown warmup')
mustInclude(workCard, '@click=', 'WorkCard.vue missing click navigation handler')

if (
  !workCard.includes('navigateCardTarget') &&
  !workCard.includes('navigateInternalHref')
) {
  fail('WorkCard.vue click handler is not aligned to SPA navigation')
}

if (
  !navLink.includes('markdownNavigationPrefetch') &&
  !navLink.includes('warmMarkdownNavigationTarget') &&
  !navLink.includes('useInternalSpaNavigation') &&
  !navLink.includes('prefetchRouteTarget')
) {
  fail('SiteNavigationLink.vue does not use shared prefetch/navigation helper')
}

mustInclude(navLink, '@pointerenter=', 'SiteNavigationLink.vue missing pointerenter warmup')
mustInclude(navLink, '@focus=', 'SiteNavigationLink.vue missing focus warmup')
mustInclude(navLink, '@click=', 'SiteNavigationLink.vue missing click handler')

if (app.includes(':key="route.fullPath"') || app.includes(':key="currentRouteKey"')) {
  fail('App.vue reintroduced route keyed RouterView')
}

const loadingClearPattern = /loadState\.value\s*=\s*['"]loading['"][\s\S]{0,160}page\.value\s*=\s*null/
if (loadingClearPattern.test(markdownPage)) {
  fail('MarkdownPage.vue reintroduced page clear during loading')
}

console.log('PASS_VT_UI_14C_PUBLIC_CONTENT_CARD_MARKDOWN_PREFETCH')
