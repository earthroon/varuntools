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
mustInclude(helper, 'export function markdownNavigationPrefetch', 'helper does not export markdownNavigationPrefetch')
mustInclude(helper, 'externalHrefPattern', 'helper does not guard external hrefs')
mustInclude(helper, 'externalProtocolPattern', 'helper does not guard protocol hrefs')
mustInclude(helper, "normalizedHref === '#'", 'helper does not guard hash-only hrefs')
mustInclude(helper, "normalizedHref.startsWith('#')", 'helper does not guard hash prefix hrefs')

mustInclude(loader, 'const pageCache = new Map<string, LoadedMarkdownPage>()', 'loader missing pageCache Map')
mustInclude(loader, 'const pendingLoads = new Map<string, Promise<LoadedMarkdownPage | null>>()', 'loader missing pendingLoads Map')
mustInclude(loader, 'const pending = pendingLoads.get(slug)', 'loader missing pending dedupe read')
mustInclude(loader, 'if (pending) return pending', 'loader lacks pending dedupe check')
mustInclude(loader, 'pendingLoads.set(slug, pendingLoad)', 'loader missing pending dedupe write')
mustInclude(loader, 'pendingLoads.delete(slug)', 'loader missing pending cleanup')
mustInclude(loader, 'export function prefetchMarkdownPageBySlug', 'loader missing prefetch export')

mustInclude(workCard, 'markdownNavigationPrefetch', 'WorkCard.vue does not import shared prefetch helper')
mustInclude(workCard, 'function warmCardTarget', 'WorkCard.vue missing warmCardTarget')
mustInclude(workCard, '@pointerenter="warmCardTarget"', 'WorkCard.vue missing pointerenter warmup')
mustInclude(workCard, '@focus="warmCardTarget"', 'WorkCard.vue missing focus warmup')
mustInclude(workCard, '@click="warmCardTarget"', 'WorkCard.vue missing click warmup')

mustInclude(navLink, 'markdownNavigationPrefetch', 'SiteNavigationLink.vue does not use shared prefetch helper')
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

console.log('PASS_VT_UI_14C_PUBLIC_CONTENT_CARD_MARKDOWN_PREFETCH')
