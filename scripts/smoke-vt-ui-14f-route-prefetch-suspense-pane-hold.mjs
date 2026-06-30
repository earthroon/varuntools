import fs from 'node:fs'

const app = fs.readFileSync('src/App.vue', 'utf8')
const routePrefetch = fs.readFileSync('src/router/routePrefetch.ts', 'utf8')
const viewport = fs.readFileSync('src/composables/useViewportInternalLinkPrefetch.ts', 'utf8')
const navigation = fs.readFileSync('src/composables/useInternalSpaNavigation.ts', 'utf8')
const recent = fs.readFileSync('src/components/home/HomeRecentPublicContent.vue', 'utf8')
const featured = fs.readFileSync('src/components/home/HomeFeaturedWorks.vue', 'utf8')
const workCard = fs.readFileSync('src/components/markdown/WorkCard.vue', 'utf8')
const grid = fs.readFileSync('src/components/content/ContentCollectionGrid.vue', 'utf8')
const markdownPage = fs.readFileSync('src/pages/MarkdownPage.vue', 'utf8')

function fail(message) {
  console.error('FAIL_VT_UI_14F_ROUTE_PREFETCH_SUSPENSE_PANE_HOLD')
  console.error(message)
  process.exit(1)
}

function mustInclude(text, token, message) {
  if (!text.includes(token)) fail(message)
}

mustInclude(routePrefetch, 'prefetchRouteTarget', 'routePrefetch.ts missing prefetchRouteTarget')
mustInclude(routePrefetch, 'pending', 'routePrefetch.ts missing pending prefetch dedupe')
mustInclude(routePrefetch, 'markdownNavigationPrefetch', 'routePrefetch.ts missing markdown prefetch bridge')
mustInclude(routePrefetch, 'router.resolve', 'routePrefetch.ts missing router.resolve route matching')

mustInclude(viewport, 'IntersectionObserver', 'viewport prefetch composable missing IntersectionObserver')
mustInclude(viewport, 'prefetchRouteTarget', 'viewport prefetch composable missing route prefetch call')

mustInclude(navigation, 'useRouter', 'useInternalSpaNavigation missing useRouter')
mustInclude(navigation, 'prefetchRouteTarget', 'useInternalSpaNavigation missing route prefetch')
mustInclude(navigation, 'event.preventDefault()', 'useInternalSpaNavigation missing preventDefault')
mustInclude(navigation, 'router.push', 'useInternalSpaNavigation missing router.push')

mustInclude(recent, 'useViewportInternalLinkPrefetch', 'HomeRecentPublicContent.vue missing viewport prefetch')
mustInclude(recent, 'useInternalSpaNavigation', 'HomeRecentPublicContent.vue missing internal SPA navigation')
mustInclude(recent, '@click=', 'HomeRecentPublicContent.vue missing SPA click handler')
mustInclude(recent, '@pointerenter=', 'HomeRecentPublicContent.vue missing pointerenter prefetch')
mustInclude(recent, '@pointerdown=', 'HomeRecentPublicContent.vue missing pointerdown prefetch')
mustInclude(recent, '@focus=', 'HomeRecentPublicContent.vue missing focus prefetch')

mustInclude(featured, 'useViewportInternalLinkPrefetch', 'HomeFeaturedWorks.vue missing viewport prefetch')
mustInclude(featured, 'useInternalSpaNavigation', 'HomeFeaturedWorks.vue missing internal SPA navigation')
mustInclude(featured, '@click=', 'HomeFeaturedWorks.vue missing viewAll SPA click handler')

const workCardUsesComposable = workCard.includes('useInternalSpaNavigation')
const workCardUsesLocalRouter = workCard.includes('useRouter') && workCard.includes('router.push')
if (!workCardUsesComposable && !workCardUsesLocalRouter) {
  fail('WorkCard.vue not aligned to internal SPA navigation')
}
mustInclude(grid, 'useViewportInternalLinkPrefetch', 'ContentCollectionGrid.vue missing viewport prefetch composable')

if (!app.includes('Suspense') && !app.includes('previous') && !app.includes('pane')) {
  fail('App.vue missing Suspense or previous pane hold structure')
}

if (app.includes(':key="route.fullPath"') || app.includes(':key="currentRouteKey"')) {
  fail('App.vue reintroduced route keyed RouterView')
}

const loadingClearPattern = /loadState\.value\s*=\s*['"]loading['"][\s\S]{0,160}page\.value\s*=\s*null/
if (loadingClearPattern.test(markdownPage)) {
  fail('MarkdownPage.vue reintroduced page clear during loading')
}

console.log('PASS_VT_UI_14F_ROUTE_PREFETCH_SUSPENSE_PANE_HOLD')
