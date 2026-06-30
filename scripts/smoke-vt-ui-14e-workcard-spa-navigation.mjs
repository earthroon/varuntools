import fs from 'node:fs'

const workCardPath = 'src/components/markdown/WorkCard.vue'
const loaderPath = 'src/markdown/lazyMarkdownPageLoader.ts'
const helperPath = 'src/markdown/markdownNavigationPrefetch.ts'
const markdownPagePath = 'src/pages/MarkdownPage.vue'
const appPath = 'src/App.vue'

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
}

function fail(message) {
  console.error('FAIL_VT_UI_14E_WORKCARD_INTERNAL_SPA_NAVIGATION')
  console.error(message)
  process.exit(1)
}

function mustInclude(text, token, message) {
  if (!text.includes(token)) fail(message)
}

const workCard = read(workCardPath)
const loader = read(loaderPath)
const helper = read(helperPath)
const markdownPage = read(markdownPagePath)
const app = read(appPath)

if (!workCard) fail('WorkCard.vue is missing')

mustInclude(workCard, "import { useRouter } from 'vue-router'", 'WorkCard.vue missing useRouter import')
mustInclude(workCard, 'const router = useRouter()', 'WorkCard.vue missing router instance')
mustInclude(workCard, 'function navigateCardTarget(event: MouseEvent): void', 'WorkCard.vue missing navigateCardTarget handler')
mustInclude(workCard, 'warmCardTarget()', 'navigateCardTarget must warm target before routing')
mustInclude(workCard, 'if (browserHandled.value) return', 'navigateCardTarget missing browserHandled guard')
mustInclude(workCard, 'if (event.defaultPrevented) return', 'navigateCardTarget missing defaultPrevented guard')
mustInclude(workCard, 'if (event.button !== 0) return', 'navigateCardTarget missing non-left click guard')
mustInclude(workCard, 'event.metaKey || event.altKey || event.ctrlKey || event.shiftKey', 'navigateCardTarget missing modified click guard')
mustInclude(workCard, 'event.preventDefault()', 'navigateCardTarget missing preventDefault')
mustInclude(workCard, 'void router.push(safeHref.value)', 'navigateCardTarget missing router.push safeHref')
mustInclude(workCard, '@click="navigateCardTarget"', 'WorkCard template must use navigateCardTarget')
mustInclude(workCard, '@pointerenter="warmCardTarget"', 'WorkCard missing pointerenter warmup')
mustInclude(workCard, '@pointerdown="warmCardTarget"', 'WorkCard missing pointerdown warmup')
mustInclude(workCard, '@focus="warmCardTarget"', 'WorkCard missing focus warmup')

if (workCard.includes('@click="warmCardTarget"')) {
  fail('WorkCard template still uses warmCardTarget as click handler')
}

mustInclude(loader, 'const pageCache = new Map<string, LoadedMarkdownPage>()', 'loader missing pageCache Map')
mustInclude(loader, 'const pendingLoads = new Map<string, Promise<LoadedMarkdownPage | null>>()', 'loader missing pendingLoads Map')
mustInclude(loader, 'export function prefetchMarkdownPageBySlug', 'loader missing prefetch export')

mustInclude(helper, 'warmMarkdownNavigationTarget', 'helper missing warmMarkdownNavigationTarget compatibility export')
mustInclude(helper, 'markdownNavigationPrefetch', 'helper missing markdownNavigationPrefetch')

if (app.includes('v-slot') && app.includes('RouterView')) {
  fail('App.vue reintroduced RouterView slot remount')
}

if (app.includes(':key="route.fullPath"') || app.includes(':key="currentRouteKey"')) {
  fail('App.vue reintroduced route keyed RouterView')
}

if (/loadState\.value = 'loading'\s*\r?\n\s*loadError\.value = ''\s*\r?\n\s*page\.value = null/.test(markdownPage)) {
  fail('MarkdownPage.vue reintroduced page clear during loading')
}

console.log('PASS_VT_UI_14E_WORKCARD_INTERNAL_SPA_NAVIGATION')
