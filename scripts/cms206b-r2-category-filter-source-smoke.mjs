#!/usr/bin/env node
import fs from 'node:fs'

function fail(message) {
  console.error('[CMS206B_R2_CATEGORY_FILTER_SOURCE_FAIL]', message)
  process.exit(1)
}

const source = fs.readFileSync('src/composables/usePublicContentCollection.ts', 'utf8')
const taxonomy = fs.readFileSync('config/public-content-taxonomy.json', 'utf8')

if (!taxonomy.includes('primaryPublicIndexCategories')) fail('taxonomy manifest must expose primaryPublicIndexCategories')
if (!source.includes('categoryOptions')) fail('categoryOptions missing')
if (!source.includes('allowedCategories.value.map')) fail('categoryOptions must be built from taxonomy allowedCategories')
if (source.includes("buildFacetIndex(allEntries.value, 'type')")) fail('categoryOptions must not use type facet')
if (!source.includes('entry.category !== category.value')) fail('category filter must compare entry.category')
if (!source.includes('const category = ref')) fail('category state missing')
console.log('CMS206B_R2_CATEGORY_FILTER_SOURCE_PASS')
