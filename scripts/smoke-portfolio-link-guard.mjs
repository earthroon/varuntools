#!/usr/bin/env node
import fs from 'node:fs'
import { parseCsv, csvRowsToObjects } from './lib/csv.mjs'
import { csvRowsToMarkdown } from './lib/csv-markdown.mjs'
import {
  buildPortfolioPageIndex,
  collectRelatedWorkReferences,
  normalizeRelatedWorkSlug,
  summarizePortfolioLinks,
  validatePortfolioLinks,
} from './lib/portfolio-link-guard.mjs'

const header = 'block,title,body,src,alt,caption,thumb,layout,kind,options,meta'
function assert(condition, message) { if (!condition) throw new Error(message) }
function rows(csv, source = 'src/content/pages/works/current/page.csv') { return csvRowsToObjects(parseCsv(csv.trim() + '\n'), { sourcePath: source }) }
const portfolioPages = [
  { slug: 'current', href: '/current', status: 'published', workStatus: 'published', related: [] },
  { slug: 'published-work', href: '/published-work', status: 'published', workStatus: 'published', related: ['current'] },
  { slug: 'private-work', href: '/private-work', status: 'published', workStatus: 'private', related: [] },
  { slug: 'draft-work', href: '/draft-work', status: 'draft', workStatus: 'draft', related: [] },
  { slug: 'archived-work', href: '/archived-work', status: 'published', workStatus: 'archived', related: [] },
]
const portfolioIndex = buildPortfolioPageIndex(portfolioPages)
function diagnosticsFor(csv, options = {}) {
  return validatePortfolioLinks(rows(csv), { currentSlug: options.currentSlug || 'current', portfolioIndex, strict: Boolean(options.strict), sourceCsvPath: 'src/content/pages/works/current/page.csv' })
}
function hasCode(diagnostics, code, level) { return diagnostics.some((diagnostic) => diagnostic.code === code && (!level || diagnostic.level === level)) }
let diagnostics = diagnosticsFor(`${header}\nrelated-works,관련 작업,,,,,,,,"items=[published-work]",`)
assert(!diagnostics.some((diagnostic) => diagnostic.code === 'PORTFOLIO_RELATED_WORK_NOT_FOUND'), 'existing related slug should pass')
assert(hasCode(diagnostics, 'PORTFOLIO_RELATED_WORK_CYCLE', 'warning'), 'direct two-way cycle should warn')
diagnostics = diagnosticsFor(`${header}\nrelated-works,관련 작업,,,,,,,,"items=[missing-work]",`)
assert(hasCode(diagnostics, 'PORTFOLIO_RELATED_WORK_NOT_FOUND', 'warning'), 'missing related slug should warn in loose mode')
diagnostics = diagnosticsFor(`${header}\nrelated-works,관련 작업,,,,,,,,"items=[missing-work]",`, { strict: true })
assert(hasCode(diagnostics, 'PORTFOLIO_RELATED_WORK_NOT_FOUND', 'error'), 'missing related slug should error in strict mode')
diagnostics = diagnosticsFor(`${header}\nrelated-works,관련 작업,,,,,,,,"items=[current]",`)
assert(hasCode(diagnostics, 'PORTFOLIO_RELATED_WORK_SELF_REFERENCE', 'warning'), 'self reference should warn')
diagnostics = diagnosticsFor(`${header}\nrelated-works,관련 작업,,,,,,,,"items=[published-work, published-work]",`)
assert(hasCode(diagnostics, 'PORTFOLIO_RELATED_WORK_DUPLICATE', 'warning'), 'duplicate related slug should warn')
diagnostics = diagnosticsFor(`${header}\nrelated-works,관련 작업,,,,,,,,"items=[private-work]",`)
assert(hasCode(diagnostics, 'PORTFOLIO_RELATED_WORK_HIDDEN', 'error'), 'private target should error')
diagnostics = diagnosticsFor(`${header}\nrelated-works,관련 작업,,,,,,,,"items=[draft-work]",`)
assert(hasCode(diagnostics, 'PORTFOLIO_RELATED_WORK_DRAFT', 'warning'), 'draft target should warn in loose mode')
diagnostics = diagnosticsFor(`${header}\nrelated-works,관련 작업,,,,,,,,"items=[draft-work]",`, { strict: true })
assert(hasCode(diagnostics, 'PORTFOLIO_RELATED_WORK_DRAFT', 'error'), 'draft target should error in strict mode')
diagnostics = diagnosticsFor(`${header}\nrelated-works,관련 작업,,,,,,,,"items=[archived-work]",`)
assert(hasCode(diagnostics, 'PORTFOLIO_RELATED_WORK_ARCHIVED', 'warning'), 'archived target should warn')
diagnostics = diagnosticsFor(`${header}\nrelated-works,관련 작업,,,,,,,,"items=[https://example.com/work]",`)
assert(hasCode(diagnostics, 'PORTFOLIO_RELATED_WORK_EXTERNAL_URL', 'error'), 'external URL should error')
assert(normalizeRelatedWorkSlug('/works/published-work') === 'published-work', '/works/foo should normalize to foo')
assert(normalizeRelatedWorkSlug('works/published-work') === 'published-work', 'works/foo should normalize to foo')
const refs = collectRelatedWorkReferences(rows(`${header}\nrelated-works,관련 작업,,,,,,,,"items=[/works/published-work]",`), { currentSlug: 'current' })
assert(refs[0]?.normalizedSlug === 'published-work', 'reference collection should normalize slugs')
const summary = summarizePortfolioLinks(rows(`${header}\nrelated-works,관련 작업,,,,,,,,"items=[published-work, missing-work, private-work, published-work]",`), { currentSlug: 'current', portfolioIndex })
assert(summary.relatedRefs === 4, 'summary should count references')
assert(summary.resolved >= 1, 'summary should count resolved references')
assert(summary.missing === 1, 'summary should count missing references')
assert(summary.hidden === 1, 'summary should count hidden references')
assert(summary.duplicates === 1, 'summary should count duplicate references')
const renderRows = rows(`${header}\npage,Link Guard,Page,,,,,,,,\nrelated-works,관련 작업,,,,,,,,"items=[published-work]",`)
const result = csvRowsToMarkdown(renderRows, { sourceCsvPath: 'src/content/pages/works/current/page.csv', outputMarkdownPath: 'src/content/pages/works/current/index.md', currentSlug: 'current', portfolioIndex })
assert(result.summary?.portfolioLinksSummary?.relatedRefs === 1, 'csv report summary should include portfolio links')
assert(!result.markdown.includes('[object Object]'), 'generated markdown should not contain [object Object]')
const componentSource = fs.readFileSync('src/components/portfolio/PortfolioRelatedWorks.vue', 'utf8')
assert(componentSource.includes('resolveRelatedWorkEntries'), 'PortfolioRelatedWorks should resolve pageRegistry entries')
assert(componentSource.includes('getWorkCollectionEntries'), 'PortfolioRelatedWorks should use Works collection visibility')
assert(!componentSource.includes('vt-related-works__fallback'), 'PortfolioRelatedWorks should not render missing strings as fallback links')
console.log('[smoke:portfolio-link-guard] OK')
