import fs from 'node:fs'

const app = fs.readFileSync('src/App.vue', 'utf8')
const page = fs.readFileSync('src/pages/MarkdownPage.vue', 'utf8')

function fail(message) {
  console.error('FAIL_VT_UI_14A_MARKDOWN_ROUTE_LOADING_FLICKER_GUARD')
  console.error(message)
  process.exit(1)
}

if (app.includes(':key="route.fullPath"') || app.includes(':key="currentRouteKey"')) {
  fail('App.vue reintroduced route keyed RouterView')
}

const loadingClearPattern = /loadState\.value\s*=\s*['"]loading['"][\s\S]{0,160}page\.value\s*=\s*null/
if (loadingClearPattern.test(page)) {
  fail('MarkdownPage.vue clears page during loading prologue')
}

if (page.includes("loadState.value = loaded ? 'ready' : 'not_found'")) {
  fail('MarkdownPage.vue still uses ternary loadState without explicit not_found page clear')
}

console.log('PASS_VT_UI_14A_MARKDOWN_ROUTE_LOADING_FLICKER_GUARD')
