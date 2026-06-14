#!/usr/bin/env node
import process from 'node:process'
import { defaultOgAssetExists, readPages, resolveSeoForPage, siteConfig } from './lib/seo-pages.mjs'

const pages = readPages()
const warnings = []
const errors = []
function warn(page, code, message) { warnings.push({ page: page.projectPath, code, message }) }
function error(page, code, message) { errors.push({ page: page?.projectPath || 'site', code, message }) }

if (!/^https:\/\/varun\.tools$/i.test(siteConfig.origin)) error(null, 'invalid-origin', `site origin must be https://varun.tools, got ${siteConfig.origin}`)
if (!defaultOgAssetExists()) error(null, 'missing-default-og', `default OG asset is missing: ${siteConfig.defaultOgImage}`)

console.log('SEO Audit')
console.log('')
for (const page of pages) {
  const seo = resolveSeoForPage(page)
  if (!page.frontmatter.title) warn(page, 'missing-title', 'Missing frontmatter title.')
  if (!seo.description) warn(page, 'missing-description', 'Missing SEO description.')
  if (seo.description && seo.description.length < 8) warn(page, 'short-description', 'Description is very short.')
  if (seo.description && seo.description.length > 180) warn(page, 'long-description', 'Description is longer than 180 characters.')
  if ((page.frontmatter.ogImage || page.frontmatter.cover || page.frontmatter.thumbnail) && !seo.asset.found) warn(page, 'missing-og-asset', `SEO image candidate is missing: ${seo.ogCandidate}`)
  console.log(page.projectPath)
  console.log(`  route: ${seo.routePath}`)
  console.log(`  title: ${seo.title}`)
  console.log(`  description: ${seo.description ? 'OK' : 'missing'}`)
  console.log(`  ogImage: ${seo.asset.found ? seo.ogCandidate : 'default fallback'}`)
  console.log(`  indexed: ${seo.noindex ? 'no' : 'yes'}`)
  console.log('')
}
console.log('Summary')
console.log(`  pages: ${pages.length}`)
console.log(`  indexed: ${pages.filter((page) => !resolveSeoForPage(page).noindex).length}`)
console.log(`  noindex: ${pages.filter((page) => resolveSeoForPage(page).noindex).length}`)
console.log(`  warnings: ${warnings.length}`)
console.log(`  errors: ${errors.length}`)
for (const item of warnings) console.log(`WARNING ${item.code}: ${item.page} — ${item.message}`)
for (const item of errors) console.error(`ERROR ${item.code}: ${item.page} — ${item.message}`)
if (errors.length) process.exit(1)
