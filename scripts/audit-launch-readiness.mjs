#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const configFile = path.join(root, 'src/config/launchReadiness.ts')
const inquiryConfigFile = path.join(root, 'src/config/inquiryForm.ts')
const pagesRoot = path.join(root, 'src/content/pages')
const policyRoot = path.join(pagesRoot, 'policies')
const baselineManifest = path.join(root, 'artifacts/qa/screenshots/baseline/manifest.json')
const searchIndexFile = path.join(root, 'public/search-index.json')

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return {}
  const data = {}
  for (const line of match[1].split('\n')) {
    const m = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/)
    if (!m) continue
    let value = m[2].trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1)
    if (value === 'true') data[m[1]] = true
    else if (value === 'false') data[m[1]] = false
    else data[m[1]] = value
  }
  return data
}
function read(file) { if (!existsSync(file)) throw new Error(`Missing required file: ${path.relative(root, file)}`); return readFileSync(file, 'utf8') }
function parseConfig() {
  const raw = read(configFile)
  const str = (key, fb = '') => raw.match(new RegExp(`${key}:\\s*'([^']*)'`))?.[1] ?? fb
  const bool = (key, fb = false) => { const m = raw.match(new RegExp(`${key}:\\s*(true|false)`)); return m ? m[1] === 'true' : fb }
  const arr = (key) => { const m = raw.match(new RegExp(`${key}:\\s*\\[([^\\]]*)\\]`)); return m ? [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]) : [] }
  return { launchMode: str('launchMode', 'prelaunch'), allowDemoProducts: bool('allowDemoProducts', true), demoProductSlugs: arr('demoProductSlugs'), requireGoogleFormConnection: bool('requireGoogleFormConnection'), requirePolicyReviewFlag: bool('requirePolicyReviewFlag'), requireOgImages: bool('requireOgImages'), requireThumbnails: bool('requireThumbnails'), requireScreenshotBaseline: bool('requireScreenshotBaseline'), failOnImageWarnings: bool('failOnImageWarnings') }
}
function walkIndexMarkdown(dir) { const out = []; if (!existsSync(dir)) return out; for (const e of readdirSync(dir, { withFileTypes: true })) { const f = path.join(dir, e.name); if (e.isDirectory()) out.push(...walkIndexMarkdown(f)); else if (e.isFile() && e.name === 'index.md') out.push(f) } return out.sort() }
function rel(file) { return path.relative(root, file).replaceAll(path.sep, '/') }
function pageRoute(file) { return path.relative(pagesRoot, path.dirname(file)).replaceAll(path.sep, '/') }
function isPublicVisible(data) { return data?.status === 'active' && data?.visibility !== 'hidden' }
function parseInquiryStatus() { if (!existsSync(inquiryConfigFile)) return { exists: false, enabled: false, entries: 0, ready: false }; const raw = read(inquiryConfigFile); const enabled = /enabled:\s*true/.test(raw); const actionUrl = raw.match(/actionUrl:\s*'([^']*)'/)?.[1] || ''; const entries = [...raw.matchAll(/:\s*'(entry\.\d+)'/g)].length; return { exists: true, enabled, entries, ready: enabled && /\/formResponse(?:[?#]|')/.test(actionUrl) && entries >= 6 } }
function parseImageWarnings() { const r = spawnSync('node', ['scripts/audit-images.mjs'], { encoding: 'utf8', shell: process.platform === 'win32' }); const output = `${r.stdout || ''}\n${r.stderr || ''}`; return { status: r.status ?? 1, warnings: Number(output.match(/warnings:\s*(\d+)/)?.[1] || 0), output } }
function parseProductUploadAudit() { const r = spawnSync('node', ['scripts/audit-product-upload.mjs'], { encoding: 'utf8', shell: process.platform === 'win32' }); const output = `${r.stdout || ''}\n${r.stderr || ''}`; return { status: r.status ?? 1, output } }
function add(list, code, message) { list.push({ code, message }) }
function printList(title, items) { console.log(`${title}: ${items.length}`); for (const item of items) console.log(`  - [${item.code}] ${item.message}`); console.log('') }

const config = parseConfig()
const blockers = [], warnings = [], notes = []
const pages = walkIndexMarkdown(pagesRoot).map((file) => ({ file, route: pageRoute(file), data: parseFrontmatter(read(file)) }))
for (const slug of config.demoProductSlugs) {
  const file = path.join(pagesRoot, 'products', slug, 'index.md')
  if (!existsSync(file)) { add(notes, 'demo-product-absent', `Demo product ${slug} is not present.`); continue }
  const data = parseFrontmatter(read(file))
  if (isPublicVisible(data) && config.allowDemoProducts) add(warnings, 'demo-product-public', `Demo product /products/${slug} is public in ${config.launchMode} mode.`)
  if (isPublicVisible(data) && !config.allowDemoProducts) add(blockers, 'demo-product-public', `Demo product /products/${slug} is public while allowDemoProducts=false.`)
  if (data.featured === true) add(blockers, 'demo-product-featured', `Demo product /products/${slug} must not be featured.`)
}
const inquiry = parseInquiryStatus()
if (!inquiry.ready) { const msg = inquiry.exists ? `Inquiry Google Form is not ready: enabled=${inquiry.enabled}, entries=${inquiry.entries}.` : 'Inquiry config file is missing.'; (config.requireGoogleFormConnection ? blockers : warnings).push({ code: 'google-form-not-ready', message: msg }) } else add(notes, 'google-form-ready', 'Inquiry Google Form configuration looks ready.')
for (const file of walkIndexMarkdown(policyRoot)) { const data = parseFrontmatter(read(file)); const reviewed = data.reviewStatus === 'reviewed' || data.policyReviewed === true; if (!reviewed) add(config.requirePolicyReviewFlag ? blockers : warnings, 'policy-review-missing', `${rel(file)} has no reviewStatus: reviewed or policyReviewed: true flag.`) }
for (const page of pages.filter((p) => isPublicVisible(p.data))) { if (config.requireThumbnails && !page.data.thumbnail) add(blockers, 'thumbnail-missing', `${page.route} has no thumbnail.`); else if (!page.data.thumbnail) add(warnings, 'thumbnail-missing', `${page.route} has no thumbnail.`); if (config.requireOgImages && !page.data.ogImage) add(blockers, 'og-image-missing', `${page.route} has no ogImage.`); else if (!page.data.ogImage) add(warnings, 'og-image-missing', `${page.route} has no ogImage.`) }
if (!existsSync(searchIndexFile)) add(blockers, 'search-index-missing', 'public/search-index.json is missing. Run npm run generate:search-index.')
else { try { const index = JSON.parse(read(searchIndexFile)); const entries = Array.isArray(index) ? index : Array.isArray(index.entries) ? index.entries : null; if (!entries) add(blockers, 'search-index-invalid', 'public/search-index.json must be an array or contain an entries array.'); else add(notes, 'search-index-present', `public/search-index.json contains ${entries.length} entries.`) } catch (e) { add(blockers, 'search-index-invalid-json', `public/search-index.json is invalid JSON: ${e.message}`) } }
if (!existsSync(baselineManifest)) add(config.requireScreenshotBaseline ? blockers : warnings, 'screenshot-baseline-missing', 'Screenshot baseline manifest is missing. Run qa:screenshots and qa:baseline when ready.'); else add(notes, 'screenshot-baseline-present', 'Screenshot baseline manifest exists.')
const productUploadAudit = parseProductUploadAudit()
if (productUploadAudit.status !== 0) add(blockers, 'product-upload-audit-failed', 'audit:product-upload failed. Fix product.manifest.json package SSOT before launch readiness can pass.')
else add(notes, 'product-upload-audit-ok', 'audit:product-upload passed.')
const imageAudit = parseImageWarnings()
if (imageAudit.status !== 0) { const missingDeps = /ERR_MODULE_NOT_FOUND|Cannot find package/.test(imageAudit.output); const msg = missingDeps ? 'audit:images could not run because dependencies are not installed in this workspace.' : 'audit:images failed unexpectedly.'; add((config.failOnImageWarnings || !missingDeps) ? blockers : warnings, missingDeps ? 'image-audit-unavailable' : 'image-audit-failed', msg) } else if (imageAudit.warnings > 0 && config.failOnImageWarnings) add(blockers, 'image-warnings-present', `audit:images reports ${imageAudit.warnings} warnings while failOnImageWarnings=true.`); else if (imageAudit.warnings > 0) add(warnings, 'image-warnings-present', `audit:images reports ${imageAudit.warnings} warnings.`); else add(notes, 'image-warnings-clear', 'audit:images reports no warnings.')
console.log('Launch Readiness Audit')
console.log('')
for (const [k, v] of Object.entries(config)) if (k !== 'demoProductSlugs') console.log(`${k}: ${v}`)
console.log('')
printList('Blockers', blockers); printList('Warnings', warnings); printList('Notes', notes)
if (blockers.length) { console.error('[audit:launch-readiness] FAILED blockers were found'); process.exit(1) }
console.log('[audit:launch-readiness] OK launch readiness audit completed')
