import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const failures = []

function fail(message) {
  failures.push(message)
}

function readText(relativePath) {
  const fullPath = path.join(root, relativePath)
  if (!fs.existsSync(fullPath)) {
    fail(`Missing file: ${relativePath}`)
    return ''
  }
  return fs.readFileSync(fullPath, 'utf8')
}

function assertIncludes(source, token, label) {
  if (!source.includes(token)) fail(`${label} missing token: ${token}`)
}

function assertNotIncludes(source, token, label) {
  if (source.includes(token)) fail(`${label} must not include token: ${token}`)
}

const app = readText('src/App.vue')
const shell = readText('src/components/CommandPaletteShell.vue')
const runtimeIndex = readText('src/composables/useRuntimePublicContentIndex.ts')
const afterFirstPaint = readText('src/utils/afterFirstPaint.ts')

assertIncludes(afterFirstPaint, 'afterFirstPaint', 'afterFirstPaint.ts')
assertIncludes(afterFirstPaint, 'requestIdleCallback', 'afterFirstPaint.ts')
assertIncludes(afterFirstPaint, 'requestAnimationFrame', 'afterFirstPaint.ts')
assertIncludes(afterFirstPaint, 'afterFirstPaintAsync', 'afterFirstPaint.ts')

assertIncludes(app, 'CommandPaletteShell', 'App.vue')
assertNotIncludes(app, "import CommandPalette from '@/components/CommandPalette.vue'", 'App.vue')
assertNotIncludes(app, '<CommandPalette />', 'App.vue')

assertIncludes(shell, 'defineAsyncComponent', 'CommandPaletteShell.vue')
assertIncludes(shell, "import('@/components/CommandPalette.vue')", 'CommandPaletteShell.vue')
assertIncludes(shell, 'afterFirstPaint', 'CommandPaletteShell.vue')
assertIncludes(shell, 'shouldMountCommandPalette', 'CommandPaletteShell.vue')

assertIncludes(runtimeIndex, 'afterFirstPaintAsync', 'useRuntimePublicContentIndex.ts')
assertIncludes(runtimeIndex, 'shouldSkipRuntimePublicContentIndexFetch', 'useRuntimePublicContentIndex.ts')
assertIncludes(runtimeIndex, 'saveData', 'useRuntimePublicContentIndex.ts')
assertIncludes(runtimeIndex, "cache: 'force-cache'", 'useRuntimePublicContentIndex.ts')
assertNotIncludes(runtimeIndex, 'Date.now', 'useRuntimePublicContentIndex.ts')
assertNotIncludes(runtimeIndex, "cache: 'no-store'", 'useRuntimePublicContentIndex.ts')
assertNotIncludes(runtimeIndex, 'no-store', 'useRuntimePublicContentIndex.ts')
assertNotIncludes(runtimeIndex, '?v=', 'useRuntimePublicContentIndex.ts')

if (failures.length) {
  console.error('FAIL_PUBLIC_ASSET_SSOT_04M_B1_MOBILE_ENTRY_FAST_PATH')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('PASS_PUBLIC_ASSET_SSOT_04M_B1_MOBILE_ENTRY_FAST_PATH')
