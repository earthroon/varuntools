#!/usr/bin/env node
import fs from 'node:fs'

function fail(message) {
  console.error('[CMS206B_R4_WORKS_TAB_PUBLIC_CATEGORY_INDEX_FAIL]', message)
  process.exit(1)
}

const worksPage = fs.readFileSync('src/pages/WorksPage.vue', 'utf8')
const taxonomy = JSON.parse(fs.readFileSync('config/public-content-taxonomy.json', 'utf8'))
const required = ['page', 'post', 'work', 'lab', 'tool', 'product']

if (!worksPage.includes('usePublicContentCollection')) fail('WorksPage must use public content collection')
if (!worksPage.includes("scope: 'index'")) fail('WorksPage must use index scope')
if (!worksPage.includes('ContentSearchPanel')) fail('WorksPage must use ContentSearchPanel')
if (!worksPage.includes('ContentCollectionGrid')) fail('WorksPage must use ContentCollectionGrid')
if (worksPage.includes('useWorksCollection')) fail('WorksPage must not use useWorksCollection')
if (worksPage.includes('WorksSearchPanel')) fail('WorksPage must not use WorksSearchPanel')
if (worksPage.includes('WorksCollectionGrid')) fail('WorksPage must not use WorksCollectionGrid')
for (const value of required) {
  if (!taxonomy.primaryPublicIndexCategories?.includes(value)) fail('missing primary category: ' + value)
}
console.log('CMS206B_R4_WORKS_TAB_PUBLIC_CATEGORY_INDEX_PASS')
