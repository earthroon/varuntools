#!/usr/bin/env node
import { buildAndWritePortfolioSeo } from './lib/portfolio-seo.mjs'

const result = buildAndWritePortfolioSeo({ projectRoot: process.cwd(), origin: process.env.SITE_ORIGIN || 'https://varun.tools' })
const summary = result.manifest.summary
console.log('[portfolio-seo] generated')
console.log(`- pages: ${summary.total}`)
console.log(`- indexable: ${summary.indexable}`)
console.log(`- noindex: ${summary.noindex}`)
console.log(`- missing title: ${summary.missingTitle}`)
console.log(`- missing description: ${summary.missingDescription}`)
console.log(`- missing image: ${summary.missingImage}`)
