#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const worksPage = fs.readFileSync(path.join(root, 'src/pages/WorksPage.vue'), 'utf8')
const taxonomy = JSON.parse(fs.readFileSync(path.join(root, 'config/public-content-taxonomy.json'), 'utf8'))
const primary = taxonomy.primaryPublicIndexCategories || []
const required = ['page', 'post', 'work', 'lab', 'tool', 'product']

if (!worksPage.includes('usePublicContentCollection')) throw new Error('/works must use public content collection')
if (!worksPage.includes("scope: 'index'")) throw new Error('/works tab must use public index scope')
if (!worksPage.includes('ContentSearchPanel')) throw new Error('/works must use ContentSearchPanel')
if (!worksPage.includes('ContentCollectionGrid')) throw new Error('/works must use ContentCollectionGrid')
if (worksPage.includes('useWorksCollection')) throw new Error('/works must not use useWorksCollection')
if (worksPage.includes('WorksSearchPanel')) throw new Error('/works must not use WorksSearchPanel')
if (worksPage.includes('WorksCollectionGrid')) throw new Error('/works must not use WorksCollectionGrid')
for (const value of required) {
  if (!primary.includes(value)) throw new Error('primary public category missing: ' + value)
}
console.log('CMS206B_WORKS_TAB_PUBLIC_CATEGORY_INDEX_PASS')
