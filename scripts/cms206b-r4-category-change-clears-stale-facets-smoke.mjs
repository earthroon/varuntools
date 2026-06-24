#!/usr/bin/env node
import fs from 'node:fs'

function fail(message) {
  console.error('[CMS206B_R4_CATEGORY_CHANGE_CLEARS_STALE_FACETS_FAIL]', message)
  process.exit(1)
}

const publicCollection = fs.readFileSync('src/composables/usePublicContentCollection.ts', 'utf8')

if (!publicCollection.includes('watch(category')) fail('category watcher missing')
if (!publicCollection.includes("tag.value = ''")) fail('category change must clear tag')
if (!publicCollection.includes("year.value = ''")) fail('category change must clear year')
if (!publicCollection.includes('featuredOnly.value = false')) fail('category change must clear featuredOnly')
console.log('CMS206B_R4_CATEGORY_CHANGE_CLEARS_STALE_FACETS_PASS')
