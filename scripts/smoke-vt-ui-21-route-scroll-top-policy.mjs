import fs from 'node:fs'

const router = fs.readFileSync('src/router/index.ts', 'utf8')
const workCard = fs.readFileSync('src/components/markdown/WorkCard.vue', 'utf8')
const markdownPage = fs.readFileSync('src/pages/MarkdownPage.vue', 'utf8')
const markdownDocumentViewPath = 'src/components/markdown/MarkdownDocumentView.vue'
const markdownDocumentView = fs.existsSync(markdownDocumentViewPath)
  ? fs.readFileSync(markdownDocumentViewPath, 'utf8')
  : ''
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

function fail(message) {
  console.error('FAIL_VT_UI_21_ROUTE_SCROLL_TOP_POLICY')
  console.error(message)
  process.exit(1)
}

function mustInclude(text, token, message) {
  if (!text.includes(token)) fail(message)
}

function mustNotInclude(text, token, message) {
  if (text.includes(token)) fail(message)
}

mustInclude(router, 'scrollBehavior(', 'router/index.ts missing scrollBehavior')
mustInclude(router, 'savedPosition', 'router/index.ts missing browser savedPosition priority')
mustInclude(router, 'if (savedPosition) return savedPosition', 'router/index.ts does not prioritize savedPosition')
mustInclude(router, 'to.hash', 'router/index.ts missing hash anchor branch')
mustInclude(router, 'el: to.hash', 'router/index.ts missing hash element target')
mustInclude(router, 'top: 84', 'router/index.ts missing fixed header hash offset')
mustInclude(router, 'top: 0', 'router/index.ts missing default top reset')
mustInclude(router, 'left: 0', 'router/index.ts missing default left reset')
mustInclude(router, "behavior: 'auto'", 'router/index.ts missing auto scroll reset behavior')

mustNotInclude(workCard, 'window.scrollTo', 'WorkCard.vue must not own route scroll policy')
mustNotInclude(markdownPage, 'window.scrollTo', 'MarkdownPage.vue must not own route scroll policy')
if (markdownDocumentView) {
  mustNotInclude(markdownDocumentView, 'window.scrollTo({ top: 0', 'MarkdownDocumentView.vue must not force route top reset')
}

if (pkg.scripts?.['smoke:vt-ui-21-route-scroll-top-policy'] !== 'node scripts/smoke-vt-ui-21-route-scroll-top-policy.mjs') {
  fail('package.json missing smoke:vt-ui-21-route-scroll-top-policy script')
}

console.log('PASS_VT_UI_21_ROUTE_NAVIGATION_SCROLL_TOP_POLICY')
console.log('PASS_VT_UI_21_NEW_MARKDOWN_PAGE_TOP_RESET')
console.log('PASS_VT_UI_21_BROWSER_BACK_SAVED_POSITION')
console.log('PASS_VT_UI_21_NO_MOBILE_DEEP_SCROLL_CARRYOVER')
