#!/usr/bin/env node
import { buildAndWriteInternalDocsSearchIndex } from './lib/page-search-index.mjs'

const result = buildAndWriteInternalDocsSearchIndex({ projectRoot: process.cwd() })
const summary = result.index.summary
console.log('[page-search:internal-docs] generated')
console.log(`- total: ${summary.total}`)
console.log(`- authoring: ${summary.authoring}`)
console.log(`- migration: ${summary.migration}`)
console.log(`- reports: ${summary.reports}`)
console.log(`- output: ${result.outPath}`)
