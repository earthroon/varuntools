#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const routeFile = fs.readFileSync(path.join(root, 'src/router/index.ts'), 'utf8')
const pageFile = fs.readFileSync(path.join(root, 'src/pages/PublicContentIndexPage.vue'), 'utf8')
const taxonomy = JSON.parse(fs.readFileSync(path.join(root, 'config/public-content-taxonomy.json'), 'utf8'))

if (!routeFile.includes("path: '/index'")) throw new Error('/index route missing')
if (!pageFile.includes('페이지, 글, 작업, 실험, 도구, 상품')) throw new Error('public content index copy missing')
for (const key of ['page', 'post', 'work', 'lab', 'tool', 'product']) {
  if (!taxonomy.publicIndexCategories.includes(key)) throw new Error('index category missing: ' + key)
}
console.log('CMS206B_PUBLIC_CONTENT_INDEX_CATEGORY_SPLIT_PASS')
