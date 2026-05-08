#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import {
  PUBLISH_DIAGNOSTIC_CODES,
  buildPortfolioPublishReport,
  createPublishReport,
  validatePublishWork,
} from './lib/portfolio-publish-gate.mjs'

function assert(condition, message) {
  if (!condition) {
    console.error(`[smoke:portfolio-publish-gate] FAIL ${message}`)
    process.exit(1)
  }
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
assert(pkg.scripts?.['check:publish'] === 'node scripts/check-portfolio-publish.mjs', 'check:publish script must exist')
assert(pkg.scripts?.['smoke:portfolio-publish-gate'] === 'node scripts/smoke-portfolio-publish-gate.mjs', 'smoke script must exist')
assert(existsSync('scripts/lib/portfolio-publish-gate.mjs'), 'portfolio-publish-gate.mjs must exist')
assert(existsSync('scripts/check-portfolio-publish.mjs'), 'check-portfolio-publish.mjs must exist')

for (const code of [
  'MISSING_TITLE',
  'MISSING_COVER',
  'RELATED_WORK_NOT_FOUND',
  'RELATED_WORK_PRIVATE',
  'ASSET_MISSING',
  'SEO_CANONICAL_INVALID',
]) {
  assert(PUBLISH_DIAGNOSTIC_CODES[code], `${code} diagnostic code must exist`)
}

const passingEntry = {
  slug: 'works/example',
  href: '/works/example',
  title: 'Example Work',
  summary: 'A sufficiently descriptive summary for the publish gate.',
  type: 'case-study',
  status: 'published',
  visibility: 'public',
  cover: './cover.svg',
  coverResolved: { exists: true },
  thumb: './thumb.svg',
  thumbResolved: { exists: true },
  alt: 'Example cover',
  tags: ['portfolio'],
  related: [],
  featured: false,
  sourcePath: 'src/content/pages/works/example/index.md',
}
const manifests = {
  assets: { assets: [] },
  seo: { pages: [{ slug: 'works/example', canonicalUrl: 'https://varun.tools/works/example', indexable: true, status: 'published', warningCodes: [] }] },
  tags: { tags: [{ works: ['works/example'] }] },
  search: { pages: [{ slug: 'works/example', indexable: true, text: 'example work portfolio searchable content text that is long enough' }] },
}
const passingDiagnostics = validatePublishWork(passingEntry, { manifests, pagesBySlug: new Map() })
assert(!passingDiagnostics.some((item) => item.level === 'error'), 'valid publish entry should have no errors')

const failingDiagnostics = validatePublishWork({ ...passingEntry, title: '', cover: '', coverResolved: { exists: false } }, { manifests, pagesBySlug: new Map() })
assert(failingDiagnostics.some((item) => item.code === PUBLISH_DIAGNOSTIC_CODES.MISSING_TITLE), 'missing title diagnostic should fire')
assert(failingDiagnostics.some((item) => item.code === PUBLISH_DIAGNOSTIC_CODES.MISSING_COVER), 'missing cover diagnostic should fire')

const report = createPublishReport([passingEntry], new Map([[passingEntry.slug, passingDiagnostics]]), {})
assert(report.version === 1, 'report version must be 1')
assert(report.summary.checked === 1, 'report should count checked works')
assert(report.works[0].passed === true, 'error=0 should pass')
const failReport = createPublishReport([{ ...passingEntry, slug: 'works/fail' }], new Map([['works/fail', failingDiagnostics]]), {})
assert(failReport.works[0].passed === false, 'error>0 should fail')

execFileSync('node', ['scripts/check-portfolio-publish.mjs'], { stdio: 'pipe' })
assert(existsSync('src/content/generated/portfolio-publish-report.json'), 'check:publish should write report json')
const generated = readFileSync('src/content/generated/portfolio-publish-report.json', 'utf8')
assert(!generated.includes('[object Object]'), 'generated report must not contain object leakage')
const generatedReport = JSON.parse(generated)
assert(generatedReport.version === 1, 'generated report version must be 1')
assert(generatedReport.summary.checked >= 1, 'generated report should check published/active work')

const launch = readFileSync('scripts/check-launch.mjs', 'utf8')
assert(launch.includes('scripts/check-portfolio-publish.mjs'), 'check:launch should run check:publish')
assert(launch.includes('scripts/smoke-portfolio-publish-gate.mjs'), 'check:launch should run smoke:portfolio-publish-gate')

const source = readFileSync('scripts/lib/portfolio-publish-gate.mjs', 'utf8')
assert(source.includes('portfolio-asset-manifest.json'), 'publish gate should reference asset manifest')
assert(source.includes('portfolio-seo-manifest.json'), 'publish gate should reference SEO manifest')
assert(source.includes('portfolio-tag-index.json'), 'publish gate should reference tag index')
assert(source.includes('page-search-index.json'), 'publish gate should reference page search index')
assert(source.includes('includeDraft'), 'publish gate should support include draft')
assert(source.includes('strictWarnings'), 'publish gate should support strict warnings')

console.log('[smoke:portfolio-publish-gate] PASS')
