#!/usr/bin/env node
import { buildAndWritePageSearchIndex } from './lib/page-search-index.mjs'

const result = buildAndWritePageSearchIndex({ projectRoot: process.cwd() })
const summary = result.index.summary
console.log('[page-search:public] generated')
console.log(`- total: ${summary.total}`)
console.log(`- works: ${summary.works}`)
console.log(`- docs: ${summary.docs}`)
console.log(`- products: ${summary.products}`)
console.log(`- pages: ${summary.pages}`)
console.log(`- output: ${result.outPath}`)
