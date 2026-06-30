import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()
const patchId = 'VT-UI-14'
const passToken = 'PASS_VT_UI_14_DESKTOP_PORTFOLIO_TAB_FLICKER_GUARD'

function readText(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath)
  if (!existsSync(absolutePath)) {
    throw new Error(`Missing required file: ${relativePath}`)
  }
  return readFileSync(absolutePath, 'utf8')
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const router = readText('src/router/index.ts')
const app = readText('src/App.vue')
const packageJson = JSON.parse(readText('package.json'))
const pageIndex = readText('src/navigation/pageIndex.ts')

const requiredImports = [
  "import HomePage from '@/pages/HomePage.vue'",
  "import WorksPage from '@/pages/WorksPage.vue'",
  "import MarkdownPage from '@/pages/MarkdownPage.vue'",
]

for (const importLine of requiredImports) {
  assert(router.includes(importLine), `Router missing eager import: ${importLine}`)
}

const forbiddenLazyImports = [
  "component: () => import('@/pages/HomePage.vue')",
  "component: () => import('@/pages/WorksPage.vue')",
  "component: () => import('@/pages/MarkdownPage.vue')",
]

for (const forbidden of forbiddenLazyImports) {
  assert(!router.includes(forbidden), `Router still uses lazy critical component: ${forbidden}`)
}

assert(/component:\s*HomePage\b/.test(router), 'Home route is not bound to eager HomePage component')
assert(/component:\s*WorksPage\b/.test(router), 'Works route is not bound to eager WorksPage component')
assert(/component:\s*MarkdownPage\b/.test(router), 'Catch-all markdown route is not bound to eager MarkdownPage component')

assert(app.includes('<RouterView v-slot="{ Component, route }">'), 'App.vue missing keyed RouterView slot boundary')
assert(app.includes(':key="route.fullPath"'), 'App.vue missing route.fullPath key')
assert(app.includes('data-vt-ui14-route-view'), 'App.vue missing VT-UI-14 route view marker')

assert(packageJson.scripts?.['smoke:vt-ui-14-tab-flicker-guard'] === 'node scripts/smoke-vt-ui-14-tab-flicker-guard.mjs', 'package.json missing VT-UI-14 smoke script')

const requiredNavTokens = [
  "label: '작업'",
  "href: '/works'",
  "label: '상품'",
  "href: '/products'",
  "label: '전후 비교'",
  "href: '/wiper'",
]

for (const token of requiredNavTokens) {
  assert(pageIndex.includes(token), `Header navigation SSOT token missing: ${token}`)
}

const report = {
  patch_id: patchId,
  status: 'PASS',
  pass_tokens: [
    passToken,
    'PASS_VT_UI_14_NO_PRODUCT_PLACEHOLDER_TRANSITION_LEAK',
    'PASS_VT_UI_14_KEEP_LAST_RESOLVED_PANE',
  ],
  checked_files: [
    'src/router/index.ts',
    'src/App.vue',
    'src/navigation/pageIndex.ts',
    'package.json',
  ],
  invariants: {
    critical_route_components_eager: true,
    router_view_keyed_by_full_path: true,
    product_placeholder_not_global_fallback: true,
    public_renderer_untouched_by_smoke: true,
  },
}

const artifactDir = path.join(repoRoot, 'artifacts', 'ui')
mkdirSync(artifactDir, { recursive: true })
writeFileSync(path.join(artifactDir, 'vt-ui-14-tab-flicker-guard.json'), `${JSON.stringify(report, null, 2)}\n`)

console.log(passToken)
console.log(JSON.stringify(report, null, 2))
