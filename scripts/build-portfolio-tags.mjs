#!/usr/bin/env node
import { buildAndWritePortfolioTagIndex } from './lib/portfolio-tags.mjs'

const result = buildAndWritePortfolioTagIndex({ projectRoot: process.cwd() })
const summary = result.index.summary
console.log('[portfolio-tags] generated')
console.log(`- total tags: ${summary.totalTags}`)
console.log(`- tagged works: ${summary.totalTaggedWorks}`)
console.log(`- empty tags: ${summary.emptyTags}`)
