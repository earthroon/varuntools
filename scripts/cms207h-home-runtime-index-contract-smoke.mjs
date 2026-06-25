#!/usr/bin/env node
import fs from 'node:fs'

const HOME_COMPONENT = 'src/components/home/HomeRecentPublicContent.vue'
const COMPOSABLE = 'src/composables/useRuntimePublicContentIndex.ts'
const PASS_STATUS = 'PASS_CMS_207H_HOME_RUNTIME_INDEX_CONTRACT_SMOKE'

function fail(message) {
  throw new Error(message)
}

if (!fs.existsSync(HOME_COMPONENT)) fail('HomeRecentPublicContent.vue is missing')
if (!fs.existsSync(COMPOSABLE)) fail('useRuntimePublicContentIndex.ts is missing')

const home = fs.readFileSync(HOME_COMPONENT, 'utf8')
const composable = fs.readFileSync(COMPOSABLE, 'utf8')

for (const marker of ['useRuntimePublicContentIndex', 'runtimeEntries', 'runtimeStatus', 'allEntries.value', 'sourceEntries']) {
  if (!home.includes(marker)) fail('home runtime index contract missing marker: ' + marker)
}

for (const marker of ['/public-content-index.json', 'cache:', 'no-store', 'runtimeStatus', 'fallback', 'console.warn']) {
  if (!composable.includes(marker)) fail('runtime public content index composable missing marker: ' + marker)
}

console.log(PASS_STATUS)
