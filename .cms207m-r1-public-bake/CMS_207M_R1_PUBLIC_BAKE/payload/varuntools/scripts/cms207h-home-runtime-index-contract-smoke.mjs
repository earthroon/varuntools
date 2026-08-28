#!/usr/bin/env node
import fs from 'node:fs'

function fail(message) {
  throw new Error(message)
}
function read(file) {
  if (!fs.existsSync(file)) fail(`${file} is missing`)
  return fs.readFileSync(file, 'utf8')
}
function requireMarker(source, marker, label) {
  if (!source.includes(marker)) fail(`${label} missing marker: ${marker}`)
}
function forbidMarker(source, marker, label) {
  if (source.includes(marker)) fail(`${label} forbidden marker: ${marker}`)
}

const home = read('src/components/home/HomeRecentPublicContent.vue')
const runtime = read('src/composables/useRuntimePublicContentIndex.ts')
const homeBuilder = read('scripts/build-home-collections.mjs')
const indexBuilder = read('scripts/build-public-content-index.mjs')

for (const marker of ['useHomeCollections', 'recentEntries', 'generated-home-collections']) {
  requireMarker(home, marker, 'HomeRecentPublicContent.vue')
}
for (const marker of ['useRuntimePublicContentIndex', 'runtimeEntries', 'runtimeStatus']) {
  forbidMarker(home, marker, 'HomeRecentPublicContent.vue')
}
for (const marker of ['/public-content-index.json', "cache: 'force-cache'", 'afterFirstPaintAsync', 'saveData', 'runtimeStatus', 'fallback']) {
  requireMarker(runtime, marker, 'useRuntimePublicContentIndex.ts')
}
for (const marker of ["cache: 'no-store'", 'Date.now', '?v=']) {
  forbidMarker(runtime, marker, 'useRuntimePublicContentIndex.ts')
}
requireMarker(homeBuilder, 'publicContentProjection.generated.json', 'build-home-collections.mjs')
requireMarker(indexBuilder, 'publicContentProjection.generated.json', 'build-public-content-index.mjs')

console.log('PASS_CMS_207H_HOME_RUNTIME_INDEX_CONTRACT_SMOKE')
