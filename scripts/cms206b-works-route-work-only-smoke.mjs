#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const worksPage = fs.readFileSync(path.join(root, 'src/pages/WorksPage.vue'), 'utf8')
const taxonomy = JSON.parse(fs.readFileSync(path.join(root, 'config/public-content-taxonomy.json'), 'utf8'))

if (!worksPage.includes('useWorksCollection')) {
  throw new Error('/works must use work collection source')
}

if (!worksPage.includes('WorksSearchPanel')) {
  throw new Error('/works must use work search panel')
}

if (!worksPage.includes('WorksCollectionGrid')) {
  throw new Error('/works must use work collection grid')
}

if (worksPage.includes('usePublicContentCollection')) {
  throw new Error('/works must not use public content collection')
}

if (worksPage.includes("scope: 'index'") || worksPage.includes('scope: "index"')) {
  throw new Error('/works must not use index scope')
}

if (taxonomy.workRouteCategories.join(',') !== 'work,case-study') {
  throw new Error('work route category scope drift')
}

console.log('CMS206B_WORKS_ROUTE_WORK_ONLY_PASS')