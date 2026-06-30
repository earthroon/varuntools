import fs from 'node:fs'

const app = fs.readFileSync('src/App.vue', 'utf8')
const page = fs.readFileSync('src/pages/MarkdownPage.vue', 'utf8')

function fail(message) {
  console.error('FAIL_VT_UI_14A_MARKDOWN_ROUTE_LOADING_FLICKER_GUARD')
  console.error(message)
  process.exit(1)
}

if (/RouterView\s+v-slot/.test(app)) {
  fail('App.vue still uses RouterView slot remount shape')
}

if (/:key="route\.fullPath"/.test(app) || /<RouterView\s+:key=/.test(app)) {
  fail('App.vue still keys RouterView by route')
}

if (/loadState\.value = 'loading'\s*\r?\n\s*loadError\.value = ''\s*\r?\n\s*page\.value = null/.test(page)) {
  fail('MarkdownPage.vue clears page during loading prologue')
}

if (/loadState\.value = loaded \? 'ready' : 'not_found'/.test(page)) {
  fail('MarkdownPage.vue still uses ternary loadState without explicit not_found page clear')
}

const hasLoadedBranch =
  /if\s*\(\s*loaded\s*\)\s*\{[\s\S]*?page\.value = loaded[\s\S]*?loadState\.value = 'ready'[\s\S]*?\}\s*else\s*\{[\s\S]*?page\.value = null[\s\S]*?loadState\.value = 'not_found'/.test(page)

if (!hasLoadedBranch) {
  fail('MarkdownPage.vue does not explicitly retain page until loaded or clear only on not_found')
}

console.log('PASS_VT_UI_14A_MARKDOWN_ROUTE_LOADING_FLICKER_GUARD')
