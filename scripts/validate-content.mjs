import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import matter from 'gray-matter'
import { resolveFilesystemAsset, getMediaAssetType } from './lib/asset-registry.mjs'

const projectRoot = process.cwd()
const contentRoot = path.join(projectRoot, 'src', 'content', 'pages')
const publicRoot = path.join(projectRoot, 'public')

const VALID_LAYOUTS = new Set(['default', 'wide', 'tool'])
const VALID_THEMES = new Set(['default', 'showroom'])
const VALID_KINDS = new Set(['page', 'work', 'tool', 'lab', 'doc', 'product'])
const VALID_STATUSES = new Set(['draft', 'active', 'archived'])
const VALID_VISIBILITIES = new Set(['public', 'hidden'])
const VALID_ROBOTS = new Set(['index,follow', 'noindex,nofollow', 'noindex,follow'])
const RESERVED_SLUGS = new Set(['works', '404'])
const ASSET_FIELDS = ['cover', 'thumbnail', 'cardCover', 'cardIcon', 'ogImage']
const VALID_CAPTION_TAGS = new Set(['필수', '선택', '기타'])
const VALID_MARKDOWN_BOX_TYPES = new Set(['note', 'tip', 'warning', 'danger', 'quote', 'decision', 'ssot'])
const VALID_MARKDOWN_BOX_TONES = new Set(['neutral', 'blue', 'amber', 'red', 'green', 'ink'])
const VALID_VIDEO_PRELOAD = new Set(['none', 'metadata', 'auto'])
const VALID_GALLERY_LAYOUTS = new Set(['strip', 'grid', 'compact'])
const BODY_DIRECTIVES = new Set(['markdown-box', 'gallery-strip', 'portfolio-hero', 'work-summary', 'role-stack', 'case-section', 'metric-card', 'tool-stack', 'quote-block', 'case-gallery', 'related-works'])

const VALID_PRODUCT_TYPES = new Set(['physical', 'digital', 'service', 'bundle', 'external'])
const VALID_PRODUCT_STATUSES = new Set(['draft', 'coming-soon', 'available', 'sold-out', 'hidden'])
const VALID_PRODUCT_CHECKOUT_PROVIDERS = new Set(['toss-payments', 'external', 'manual', 'none'])
const VALID_PRODUCT_CHECKOUT_MODES = new Set(['toss-ready', 'external-checkout', 'manual-inquiry', 'disabled'])
const VALID_PRODUCT_DOWNLOAD_PROVIDERS = new Set(['cloudflare', 'external', 'manual'])
const VALID_PRODUCT_CATEGORIES = new Set(['stickers', 'prints', 'templates', 'presets', 'tools', 'assets', 'services', 'bundles'])
const VALID_PRODUCT_SUBCATEGORIES = new Set(['notion', 'writing', 'color', 'print', 'web', 'ui-kit', 'texture', 'workflow'])
const VALID_PRODUCT_COLLECTIONS = new Set(['varun-tools', 'dreamcolor', 'earthroon', 'dadumdadum', 'delta-k'])
const VALID_WORK_TYPES = new Set(['case-study', 'tool', 'visual', 'service', 'experiment', 'store', 'system'])
const VALID_WORK_STATUSES = new Set(['draft', 'published', 'archived', 'private'])
const TAXONOMY_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const DEFAULT_OG_IMAGE = '/og/default-og.svg'
const SITE_ORIGIN = 'https://varun.tools'

const NESTED_MARKDOWN_BOX_DIRECTIVES = new Set([
  'captioned-image',
  'before-after',
  'pagecard-grid',
  'markdown-box',
  'section-gap',
  'section-break',
  'image-card',
  'featured-works',
  'work-card',
  'video',
  'video-player',
  'home-section',
  'note',
  'warning',
  'tip',
])
const LEGACY_BA_IMAGE_RE = /^!\[(?<alt>[^\]]*)\]\((?<target>.*)\)\s*$/
const LEGACY_BA_MARKER_RE = /^\s*\[(?<kind>전|후)\]\s*(?<label>.*)?$/
const PAGECARD_BLOCKQUOTE_WIKILINK_RE = /^\s*>\s*\[\[(?<href>[^\]]+)\]\]\s*$/
const PAGECARD_CALLOUT_RE = /^\s*>\s*\[!pagecards\]\s*$/i
const PAGECARD_LIST_MARKER_RE = /^\s*\[pagecards\]\s*$/i
const PAGECARD_HREF_RE = /^\/[A-Za-z0-9가-힣._~/-]+$/
const LEGACY_BOX_CALLOUT_RE = /^\s*>\s*\[!(?<type>note|tip|warning|danger|quote|decision|ssot)\]\s*(?<title>.*)$/i
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const issues = []

function toProjectPath(filePath) {
  return path.relative(projectRoot, filePath).replace(/\\/g, '/')
}

function addIssue(issue) {
  issues.push({
    severity: issue.severity,
    kind: issue.kind,
    file: toProjectPath(issue.file),
    field: issue.field,
    value: issue.value,
    message: issue.message,
  })
}

function walkMarkdownIndexFiles(dir) {
  const results = []
  if (!existsSync(dir)) return results

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...walkMarkdownIndexFiles(fullPath))
    } else if (entry.isFile() && entry.name === 'index.md') {
      results.push(fullPath)
    }
  }

  return results.sort()
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function parseMarkdownFile(file) {
  const raw = readFileSync(file, 'utf8')
  const parsed = matter(raw)
  return { file, raw, frontmatter: isPlainObject(parsed.data) ? parsed.data : {} }
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function validateRequiredFields(page) {
  for (const field of ['title', 'slug']) {
    if (!isNonEmptyString(page.frontmatter[field])) {
      addIssue({ severity: 'error', kind: 'missing-required-field', file: page.file, field, value: page.frontmatter[field], message: `Missing required frontmatter field: ${field}` })
    }
  }
}

function validateSlugFormat(page) {
  const slug = page.frontmatter.slug
  if (!isNonEmptyString(slug)) return

  if (slug !== slug.trim()) {
    addIssue({ severity: 'error', kind: 'invalid-slug-format', file: page.file, field: 'slug', value: slug, message: 'Slug must not contain leading or trailing whitespace.' })
  }
  if (slug.startsWith('/') || slug.endsWith('/')) {
    addIssue({ severity: 'error', kind: 'invalid-slug-format', file: page.file, field: 'slug', value: slug, message: 'Slug must not start or end with a slash.' })
  }
  if (slug.includes('//')) {
    addIssue({ severity: 'error', kind: 'invalid-slug-format', file: page.file, field: 'slug', value: slug, message: 'Slug must not contain duplicate slashes.' })
  }
  if (/\s/.test(slug)) {
    addIssue({ severity: 'error', kind: 'invalid-slug-format', file: page.file, field: 'slug', value: slug, message: 'Slug must not contain whitespace.' })
  }
  const projectPath = toProjectPath(page.file)
  const allowedReservedSlug = projectPath === 'src/content/pages/works/index.md' && slug === 'works'
  if (RESERVED_SLUGS.has(slug) && !allowedReservedSlug) {
    addIssue({ severity: 'error', kind: 'reserved-slug-conflict', file: page.file, field: 'slug', value: slug, message: `Slug conflicts with reserved app route: ${slug}` })
  }
}

function validateDuplicateSlugs(pages) {
  const slugMap = new Map()
  for (const page of pages) {
    const slug = page.frontmatter.slug
    if (!isNonEmptyString(slug)) continue
    const list = slugMap.get(slug) || []
    list.push(page.file)
    slugMap.set(slug, list)
  }
  for (const [slug, files] of slugMap.entries()) {
    if (files.length <= 1) continue
    for (const file of files) {
      addIssue({ severity: 'error', kind: 'duplicate-slug', file, field: 'slug', value: slug, message: `Duplicate slug detected: ${slug}. Files: ${files.map(toProjectPath).join(', ')}` })
    }
  }
}

function validateEnumField(page, field, validValues) {
  const value = page.frontmatter[field]
  if (value === undefined || value === null || value === '') return
  if (typeof value !== 'string' || !validValues.has(value)) {
    addIssue({ severity: 'error', kind: 'invalid-enum', file: page.file, field, value, message: `Invalid ${field}. Allowed values: ${Array.from(validValues).join(', ')}` })
  }
}

function validateEnums(page) {
  validateEnumField(page, 'layout', VALID_LAYOUTS)
  validateEnumField(page, 'theme', VALID_THEMES)
  validateEnumField(page, 'kind', VALID_KINDS)
  validateEnumField(page, 'status', VALID_STATUSES)
  validateEnumField(page, 'visibility', VALID_VISIBILITIES)
  validateEnumField(page, 'robots', VALID_ROBOTS)
}

function validateArrayField(page, field) {
  const value = page.frontmatter[field]
  if (value === undefined || value === null) return
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !item.trim())) {
    addIssue({ severity: 'error', kind: 'invalid-array-field', file: page.file, field, value, message: `${field} must be an array of non-empty strings.` })
  }
}

function validatePrimitiveFields(page) {
  validateArrayField(page, 'tags')
  validateArrayField(page, 'related')
  if (page.frontmatter.order !== undefined && typeof page.frontmatter.order !== 'number') {
    addIssue({ severity: 'error', kind: 'invalid-number-field', file: page.file, field: 'order', value: page.frontmatter.order, message: 'order must be a number.' })
  }
  if (page.frontmatter.featured !== undefined && typeof page.frontmatter.featured !== 'boolean') {
    addIssue({ severity: 'error', kind: 'invalid-boolean-field', file: page.file, field: 'featured', value: page.frontmatter.featured, message: 'featured must be a boolean.' })
  }
  if (page.frontmatter.noindex !== undefined && typeof page.frontmatter.noindex !== 'boolean') {
    addIssue({ severity: 'warning', kind: 'invalid-boolean-field', file: page.file, field: 'noindex', value: page.frontmatter.noindex, message: 'noindex should be a boolean.' })
  }
  if (page.frontmatter.draft !== undefined && typeof page.frontmatter.draft !== 'boolean') {
    addIssue({ severity: 'warning', kind: 'invalid-boolean-field', file: page.file, field: 'draft', value: page.frontmatter.draft, message: 'draft should be a boolean.' })
  }
  for (const stringField of ['role', 'client', 'externalUrl', 'license', 'collection', 'material', 'size', 'releaseDate']) {
    if (page.frontmatter[stringField] !== undefined && typeof page.frontmatter[stringField] !== 'string') {
      addIssue({ severity: 'warning', kind: 'invalid-string-field', file: page.file, field: stringField, value: page.frontmatter[stringField], message: `${stringField} should be a string.` })
    }
  }
  if (page.frontmatter.gallery !== undefined) {
    if (!isPlainObject(page.frontmatter.gallery)) {
      addIssue({ severity: 'warning', kind: 'invalid-gallery-field', file: page.file, field: 'gallery', value: page.frontmatter.gallery, message: 'gallery should be an object.' })
    } else if (page.frontmatter.gallery.autoMini !== undefined && typeof page.frontmatter.gallery.autoMini !== 'boolean') {
      addIssue({ severity: 'warning', kind: 'invalid-boolean-field', file: page.file, field: 'gallery.autoMini', value: page.frontmatter.gallery.autoMini, message: 'gallery.autoMini should be a boolean.' })
    }
  }
}

function isValidRealDate(value) {
  if (!DATE_RE.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}


function isProductDetailPage(page) {
  const rel = toProjectPath(page.file)
  return /^src\/content\/pages\/products\/[^/]+\/index\.md$/.test(rel) && rel !== 'src/content/pages/products/index.md' && !rel.startsWith('src/content/pages/products/categories/')
}

function validateProductFields(page) {
  const product = page.frontmatter.product
  if (product === undefined || product === null) {
    if (isProductDetailPage(page)) {
      addIssue({ severity: 'warning', kind: 'product-missing-frontmatter', file: page.file, field: 'product', value: product, message: 'Product detail pages should include product frontmatter.' })
    }
    return
  }

  if (!isPlainObject(product)) {
    addIssue({ severity: 'warning', kind: 'invalid-product-field', file: page.file, field: 'product', value: product, message: 'product should be an object.' })
    return
  }

  if (product.type !== undefined && !VALID_PRODUCT_TYPES.has(String(product.type))) {
    addIssue({ severity: 'warning', kind: 'invalid-product-type', file: page.file, field: 'product.type', value: product.type, message: `product.type should be one of ${Array.from(VALID_PRODUCT_TYPES).join(', ')}.` })
  }

  const taxonomyType = validateTaxonomySlug(page, 'product.type', product.type)
  const taxonomyCategory = validateTaxonomySlug(page, 'product.category', product.category)
  const taxonomySubcategory = validateTaxonomySlug(page, 'product.subcategory', product.subcategory)
  const taxonomyCollection = validateTaxonomySlug(page, 'product.collection', product.collection)
  const taxonomySeries = validateTaxonomySlug(page, 'product.series', product.series)
  warnUnknownTaxonomy(page, 'product.type', taxonomyType, VALID_PRODUCT_TYPES)
  warnUnknownTaxonomy(page, 'product.category', taxonomyCategory, VALID_PRODUCT_CATEGORIES)
  warnUnknownTaxonomy(page, 'product.subcategory', taxonomySubcategory, VALID_PRODUCT_SUBCATEGORIES)
  warnUnknownTaxonomy(page, 'product.collection', taxonomyCollection, VALID_PRODUCT_COLLECTIONS)
  void taxonomySeries
  if (isProductDetailPage(page) && !isNonEmptyString(product.category)) addIssue({ severity: 'warning', kind: 'product-missing-category', file: page.file, field: 'product.category', value: product.category, message: 'Product detail pages should set product.category so the store shelf is explicit.' })
  if (product.status === 'published') addIssue({ severity: 'error', kind: 'product-status-published-forbidden', file: page.file, field: 'product.status', value: product.status, message: 'product.status=published is forbidden. Use draft, coming-soon, available, sold-out, or hidden.' })

  if (product.status !== undefined && !VALID_PRODUCT_STATUSES.has(String(product.status))) {
    addIssue({ severity: 'warning', kind: 'invalid-product-status', file: page.file, field: 'product.status', value: product.status, message: `product.status should be one of ${Array.from(VALID_PRODUCT_STATUSES).join(', ')}.` })
  }

  if (!isNonEmptyString(product.sku) && isProductDetailPage(page)) {
    addIssue({ severity: 'warning', kind: 'product-missing-sku', file: page.file, field: 'product.sku', value: product.sku, message: 'Product detail pages should include product.sku.' })
  }

  if (product.price !== undefined && typeof product.price !== 'number' && typeof product.price !== 'string') {
    addIssue({ severity: 'warning', kind: 'invalid-product-price', file: page.file, field: 'product.price', value: product.price, message: 'product.price should be a number or string.' })
  }

  if ((product.price !== undefined && product.price !== '') && !isNonEmptyString(product.currency)) {
    addIssue({ severity: 'warning', kind: 'product-missing-currency', file: page.file, field: 'product.currency', value: product.currency, message: 'product.currency is recommended when product.price exists.' })
  }

  for (const boolField of ['shippingRequired', 'priceVisible', 'showWhenUnavailable']) {
    if (product[boolField] !== undefined && typeof product[boolField] !== 'boolean') {
      addIssue({ severity: 'warning', kind: 'invalid-product-boolean', file: page.file, field: `product.${boolField}`, value: product[boolField], message: `product.${boolField} should be a boolean.` })
    }
  }

  if (product.checkoutProvider !== undefined && !VALID_PRODUCT_CHECKOUT_PROVIDERS.has(String(product.checkoutProvider))) {
    addIssue({ severity: 'warning', kind: 'invalid-product-checkout-provider', file: page.file, field: 'product.checkoutProvider', value: product.checkoutProvider, message: 'product.checkoutProvider should be toss-payments, external, manual, or none.' })
  }

  if (isNonEmptyString(product.checkoutUrl) && product.checkoutProvider !== 'toss-payments') {
    addIssue({ severity: 'warning', kind: 'product-checkout-provider-mismatch', file: page.file, field: 'product.checkoutProvider', value: product.checkoutProvider, message: 'Toss Payments checkout links should use product.checkoutProvider: toss-payments.' })
  }

  const checkoutMode = String(product.checkoutMode || 'disabled').trim()
  if (product.checkoutMode !== undefined && !VALID_PRODUCT_CHECKOUT_MODES.has(checkoutMode)) {
    addIssue({ severity: 'warning', kind: 'invalid-product-checkout-mode', file: page.file, field: 'product.checkoutMode', value: product.checkoutMode, message: 'product.checkoutMode should be toss-ready, external-checkout, manual-inquiry, or disabled.' })
  }

  if (checkoutMode === 'toss-ready' && product.checkoutProvider !== 'toss-payments') {
    addIssue({ severity: 'warning', kind: 'product-checkout-mode-provider-mismatch', file: page.file, field: 'product.checkoutProvider', value: product.checkoutProvider, message: 'checkoutMode=toss-ready requires checkoutProvider=toss-payments.' })
  }

  if (checkoutMode === 'toss-ready' && !isNonEmptyString(product.checkoutUrl)) {
    addIssue({ severity: 'warning', kind: 'product-toss-ready-missing-checkout-url', file: page.file, field: 'product.checkoutUrl', value: product.checkoutUrl, message: 'checkoutMode=toss-ready requires product.checkoutUrl.' })
  }

  if (checkoutMode === 'toss-ready' && !isNonEmptyString(product.successUrl)) {
    addIssue({ severity: 'warning', kind: 'product-toss-ready-missing-success-url', file: page.file, field: 'product.successUrl', value: product.successUrl, message: 'checkoutMode=toss-ready should set product.successUrl.' })
  }

  if (checkoutMode === 'toss-ready' && !isNonEmptyString(product.failUrl)) {
    addIssue({ severity: 'warning', kind: 'product-toss-ready-missing-fail-url', file: page.file, field: 'product.failUrl', value: product.failUrl, message: 'checkoutMode=toss-ready should set product.failUrl.' })
  }

  if (checkoutMode === 'external-checkout' && !isNonEmptyString(product.externalStoreUrl) && !isNonEmptyString(product.checkoutUrl)) {
    addIssue({ severity: 'warning', kind: 'product-external-checkout-missing-url', file: page.file, field: 'product.externalStoreUrl', value: product.externalStoreUrl, message: 'checkoutMode=external-checkout requires externalStoreUrl or checkoutUrl.' })
  }

  if (checkoutMode === 'manual-inquiry' && !isNonEmptyString(product.inquiryUrl)) {
    addIssue({ severity: 'warning', kind: 'product-manual-inquiry-missing-inquiry-url', file: page.file, field: 'product.inquiryUrl', value: product.inquiryUrl, message: 'checkoutMode=manual-inquiry requires product.inquiryUrl.' })
  }

  if (checkoutMode === 'disabled' && isNonEmptyString(product.checkoutUrl)) {
    addIssue({ severity: 'warning', kind: 'product-disabled-with-checkout-url', file: page.file, field: 'product.checkoutUrl', value: product.checkoutUrl, message: 'checkoutMode=disabled should not keep a checkoutUrl.' })
  }

  if (product.downloadProvider !== undefined && !VALID_PRODUCT_DOWNLOAD_PROVIDERS.has(String(product.downloadProvider))) {
    addIssue({ severity: 'warning', kind: 'invalid-product-download-provider', file: page.file, field: 'product.downloadProvider', value: product.downloadProvider, message: 'product.downloadProvider should be cloudflare, external, or manual.' })
  }

  for (const stringField of ['externalUrl', 'license', 'category', 'subcategory', 'series', 'collection', 'material', 'size', 'releaseDate', 'shippingNote', 'refundNote', 'digitalDeliveryNote', 'policyNote', 'inquiryUrl', 'checkoutMode', 'successUrl', 'failUrl', 'claimRedirect']) {
    if (product[stringField] !== undefined && typeof product[stringField] !== 'string') {
      addIssue({ severity: 'warning', kind: 'invalid-product-string-field', file: page.file, field: `product.${stringField}`, value: product[stringField], message: `product.${stringField} should be a string.` })
    }
  }

  if (product.releaseDate !== undefined && product.releaseDate !== '' && (typeof product.releaseDate !== 'string' || !isValidRealDate(product.releaseDate))) {
    addIssue({ severity: 'warning', kind: 'invalid-product-release-date', file: page.file, field: 'product.releaseDate', value: product.releaseDate, message: 'product.releaseDate should be a real date in YYYY-MM-DD format when present.' })
  }

  for (const urlField of ['checkoutUrl', 'successUrl', 'failUrl', 'claimRedirect', 'externalStoreUrl', 'downloadUrl', 'inquiryUrl', 'externalUrl']) {
    if (product[urlField] !== undefined && typeof product[urlField] !== 'string') {
      addIssue({ severity: 'warning', kind: 'invalid-product-url-field', file: page.file, field: `product.${urlField}`, value: product[urlField], message: `product.${urlField} should be a string URL or empty string.` })
    }
  }

  if (product.status === 'available' && !isNonEmptyString(product.checkoutUrl) && !isNonEmptyString(product.externalStoreUrl) && !isNonEmptyString(product.inquiryUrl)) {
    addIssue({ severity: 'warning', kind: 'product-available-without-checkout', file: page.file, field: 'product.checkoutUrl', value: product.checkoutUrl, message: 'Available products should set product.checkoutUrl, product.externalStoreUrl, or product.inquiryUrl.' })
  }

  if (product.type === 'service' && product.status === 'available' && product.priceVisible === false && !isNonEmptyString(product.checkoutUrl) && !isNonEmptyString(product.externalStoreUrl) && !isNonEmptyString(product.inquiryUrl)) {
    addIssue({ severity: 'warning', kind: 'product-service-missing-inquiry', file: page.file, field: 'product.inquiryUrl', value: product.inquiryUrl, message: 'Available service products with hidden price should provide product.inquiryUrl unless checkout/externalStoreUrl is set.' })
  }

  if (product.type === 'digital' && product.status === 'available' && !isNonEmptyString(product.downloadUrl)) {
    addIssue({ severity: 'warning', kind: 'digital-product-missing-download', file: page.file, field: 'product.downloadUrl', value: product.downloadUrl, message: 'Available digital products should set product.downloadUrl for Cloudflare delivery.' })
  }

  const body = matter(page.raw).content.replace(/\r\n/g, '\n')
  const hasProductCta = /^::product-cta\s*$/m.test(body)
  const hasProductTrust = /^::product-trust\s*$/m.test(body)

  if (isProductDetailPage(page) && !hasProductCta) {
    addIssue({ severity: 'warning', kind: 'product-detail-missing-cta', file: page.file, field: 'product-cta', value: '', message: 'Product detail pages should include ::product-cta so purchase status is visible.' })
  }

  if (isProductDetailPage(page) && hasProductCta && !hasProductTrust) {
    addIssue({ severity: 'warning', kind: 'product-detail-missing-trust', file: page.file, field: 'product-trust', value: '', message: 'Product detail pages with ::product-cta should also include ::product-trust so policy links are visible.' })
  }

  if (hasProductTrust && !product) {
    addIssue({ severity: 'warning', kind: 'product-trust-without-product', file: page.file, field: 'product-trust', value: '', message: '::product-trust should be used on pages with product frontmatter.' })
  }

  if (product.type === 'physical' && product.shippingRequired === undefined) {
    addIssue({ severity: 'warning', kind: 'physical-product-shipping-undefined', file: page.file, field: 'product.shippingRequired', value: product.shippingRequired, message: 'Physical products should explicitly set product.shippingRequired.' })
  }
}


function validateTaxonomySlug(page, field, value) {
  if (value === undefined || value === null || value === '') return ''
  if (typeof value !== 'string') { addIssue({ severity: 'warning', kind: 'invalid-product-taxonomy-field', file: page.file, field, value, message: `${field} should be a kebab-case string.` }); return '' }
  const trimmed = value.trim()
  if (!TAXONOMY_SLUG_RE.test(trimmed)) addIssue({ severity: 'warning', kind: 'product-taxonomy-non-kebab-case', file: page.file, field, value, message: `${field} should use lowercase kebab-case for stable filtering.` })
  return trimmed
}
function warnUnknownTaxonomy(page, field, value, validValues) { if (value && !validValues.has(value)) addIssue({ severity: 'warning', kind: 'unknown-product-taxonomy', file: page.file, field, value, message: `${field} is not in the current store taxonomy list. Keep it only if this is an intentional new shelf value.` }) }

function validateDateField(page, field) {
  const value = page.frontmatter[field]
  if (value === undefined || value === null || value === '') return
  if (typeof value !== 'string' || !isValidRealDate(value)) {
    addIssue({ severity: 'error', kind: 'invalid-date-format', file: page.file, field, value, message: `${field} must be a real date in YYYY-MM-DD format.` })
  }
}

function validateDates(page) {
  validateDateField(page, 'date')
  validateDateField(page, 'updated')
  validateDateField(page, 'releaseDate')
}

function validateResolvedAsset(page, field, value, options = {}) {
  const required = options.required === true
  const missingSeverity = options.missingSeverity || 'error'

  if (value === undefined || value === null || value === '') {
    if (required) {
      addIssue({ severity: 'error', kind: 'asset-empty-source', file: page.file, field, value, message: `${field} requires a non-empty asset source.` })
    }
    return null
  }

  if (typeof value !== 'string') {
    addIssue({ severity: 'error', kind: 'asset-invalid-source', file: page.file, field, value, message: `${field} must be a string asset path.` })
    return null
  }

  const result = resolveFilesystemAsset({
    source: value,
    contentFilePath: page.file,
    projectRoot,
    contentRoot,
    publicRoot,
  })

  if (result.reason === 'unsafe_path' || result.reason === 'unsupported_protocol') {
    addIssue({ severity: 'error', kind: `asset-${result.reason}`, file: page.file, field, value, message: `Invalid asset path: ${result.reason}.` })
    return result
  }

  if (!result.found) {
    addIssue({ severity: missingSeverity, kind: `asset-${result.reason}`, file: page.file, field, value, message: `Asset not found: ${result.relativePath || toProjectPath(result.absolutePath || '') || value}` })
    return result
  }

  if (result.warning) {
    addIssue({ severity: 'warning', kind: `asset-${result.warning}`, file: page.file, field, value, message: `Asset resolved with warning: ${result.warning}.` })
  }

  return result
}

function validateAssetField(page, field) {
  validateResolvedAsset(page, field, page.frontmatter[field], { missingSeverity: 'error' })
}

function validateAssets(page) {
  for (const field of ASSET_FIELDS) validateAssetField(page, field)
}


function parseDirectiveAttrs(rawBlock) {
  const attrs = {}
  const lines = rawBlock.replace(/\r\n/g, '\n').split('\n').slice(1, -1)
  for (const line of lines) {
    const match = line.match(/^([a-zA-Z][a-zA-Z0-9_-]*):\s*(.*)$/)
    if (!match) continue
    const value = match[2].trim()
    if (value === 'true') attrs[match[1]] = true
    else if (value === 'false') attrs[match[1]] = false
    else attrs[match[1]] = value
  }
  return attrs
}

function iterCaptionedImageDirectives(raw) {
  const blocks = []
  const re = /^::captioned-image\s*$([\s\S]*?)^::\s*$/gm
  let match
  while ((match = re.exec(raw))) blocks.push(match[0])
  return blocks
}

function validateCaptionedImages(page) {
  const blocks = iterCaptionedImageDirectives(page.raw)

  for (const block of blocks) {
    const attrs = parseDirectiveAttrs(block)

    if (!isNonEmptyString(attrs.src)) {
      addIssue({ severity: 'error', kind: 'captioned-image-missing-src', file: page.file, field: 'captioned-image.src', value: attrs.src, message: 'captioned-image directive requires a non-empty src.' })
      continue
    }

    validateResolvedAsset(page, 'captioned-image.src', attrs.src, { required: true, missingSeverity: 'error' })

    if (attrs.tag !== undefined && !VALID_CAPTION_TAGS.has(String(attrs.tag))) {
      addIssue({ severity: 'warning', kind: 'captioned-image-unknown-tag', file: page.file, field: 'captioned-image.tag', value: attrs.tag, message: `Unknown captioned-image tag. Allowed values: ${Array.from(VALID_CAPTION_TAGS).join(', ')}` })
    }

    if (attrs.tag !== undefined && !isNonEmptyString(attrs.caption)) {
      addIssue({ severity: 'warning', kind: 'captioned-image-tag-without-caption', file: page.file, field: 'captioned-image.caption', value: attrs.caption, message: 'captioned-image has a tag but no caption.' })
    }

    if (attrs.lightbox !== undefined && typeof attrs.lightbox !== 'boolean') {
      addIssue({ severity: 'warning', kind: 'captioned-image-invalid-lightbox', file: page.file, field: 'captioned-image.lightbox', value: attrs.lightbox, message: 'captioned-image lightbox should be true or false.' })
    }
  }
}


function iterBeforeAfterDirectives(raw) {
  const blocks = []
  const re = /^::before-after\s*$([\s\S]*?)^::\s*$/gm
  let match
  while ((match = re.exec(raw))) blocks.push(match[0])
  return blocks
}

function validateBeforeAfterDirectives(page) {
  const blocks = iterBeforeAfterDirectives(page.raw)

  for (const block of blocks) {
    const attrs = parseDirectiveAttrs(block)

    if (!isNonEmptyString(attrs.before)) {
      addIssue({ severity: 'error', kind: 'before-after-missing-before', file: page.file, field: 'before-after.before', value: attrs.before, message: 'before-after directive requires a non-empty before asset path.' })
    } else {
      validateResolvedAsset(page, 'before-after.before', attrs.before, { required: true, missingSeverity: 'error' })
    }

    if (!isNonEmptyString(attrs.after)) {
      addIssue({ severity: 'error', kind: 'before-after-missing-after', file: page.file, field: 'before-after.after', value: attrs.after, message: 'before-after directive requires a non-empty after asset path.' })
    } else {
      validateResolvedAsset(page, 'before-after.after', attrs.after, { required: true, missingSeverity: 'error' })
    }

    if (isNonEmptyString(attrs.before) && attrs.before === attrs.after) {
      addIssue({ severity: 'warning', kind: 'before-after-same-asset', file: page.file, field: 'before-after.after', value: attrs.after, message: 'before-after uses the same asset for before and after.' })
    }

    if (attrs.initial !== undefined) {
      const initial = Number(attrs.initial)
      if (!Number.isFinite(initial)) {
        addIssue({ severity: 'warning', kind: 'before-after-invalid-initial', file: page.file, field: 'before-after.initial', value: attrs.initial, message: 'before-after initial should be a finite number.' })
      } else if (initial < 0 || initial > 100) {
        addIssue({ severity: 'warning', kind: 'before-after-initial-clamped', file: page.file, field: 'before-after.initial', value: attrs.initial, message: 'before-after initial will be clamped to the 0..100 range.' })
      }
    }
  }
}



function iterVideoPlayerDirectives(raw) {
  const blocks = []
  for (const name of ['video', 'video-player']) {
    const re = new RegExp(`^::${name}\\s*$([\\s\\S]*?)^::\\s*$`, 'gm')
    let match
    while ((match = re.exec(raw))) blocks.push({ name, raw: match[0] })
  }
  return blocks
}

function validateVideoPlayerDirectives(page) {
  const blocks = iterVideoPlayerDirectives(page.raw)

  for (const block of blocks) {
    const attrs = parseDirectiveAttrs(block.raw)
    const hasSrc = isNonEmptyString(attrs.src) || isNonEmptyString(attrs.fallback)
    const hasStream = isNonEmptyString(attrs.stream)

    if (!hasSrc && !hasStream) {
      addIssue({ severity: 'error', kind: 'video-player-missing-source', file: page.file, field: `${block.name}.src`, value: '', message: 'video-player requires src, fallback, or stream.' })
      continue
    }

    if (hasSrc && hasStream) {
      addIssue({ severity: 'warning', kind: 'video-player-src-and-stream', file: page.file, field: `${block.name}.stream`, value: attrs.stream, message: 'video-player should use either src/fallback or stream, not both.' })
    }

    for (const field of ['src', 'fallback']) {
      if (!isNonEmptyString(attrs[field])) continue
      const result = validateResolvedAsset(page, `${block.name}.${field}`, attrs[field], { required: true, missingSeverity: 'error' })
      const mediaType = getMediaAssetType(String(attrs[field]))
      if (result?.found && mediaType !== 'video' && mediaType !== 'unknown') {
        addIssue({ severity: 'warning', kind: 'video-player-invalid-video-type', file: page.file, field: `${block.name}.${field}`, value: attrs[field], message: `${field} should point to a video file such as .mp4 or .webm.` })
      }
    }

    if (isNonEmptyString(attrs.stream)) {
      const result = validateResolvedAsset(page, `${block.name}.stream`, attrs.stream, { required: true, missingSeverity: 'warning' })
      const mediaType = getMediaAssetType(String(attrs.stream))
      if (result?.found && mediaType !== 'stream' && mediaType !== 'unknown') {
        addIssue({ severity: 'warning', kind: 'video-player-invalid-stream-type', file: page.file, field: `${block.name}.stream`, value: attrs.stream, message: 'stream should point to .m3u8 or .mpd.' })
      }
    }

    if (isNonEmptyString(attrs.poster)) {
      const result = validateResolvedAsset(page, `${block.name}.poster`, attrs.poster, { required: false, missingSeverity: 'warning' })
      const mediaType = getMediaAssetType(String(attrs.poster))
      if (result?.found && mediaType !== 'image' && mediaType !== 'unknown') {
        addIssue({ severity: 'warning', kind: 'video-player-invalid-poster-type', file: page.file, field: `${block.name}.poster`, value: attrs.poster, message: 'poster should point to an image asset.' })
      }
    }

    for (const boolField of ['controls', 'autoplay', 'loop', 'muted', 'playsInline', 'playsinline']) {
      if (attrs[boolField] !== undefined && typeof attrs[boolField] !== 'boolean') {
        addIssue({ severity: 'warning', kind: 'video-player-invalid-boolean', file: page.file, field: `${block.name}.${boolField}`, value: attrs[boolField], message: `${boolField} should be true or false.` })
      }
    }

    if (attrs.autoplay === true && attrs.muted !== true) {
      addIssue({ severity: 'warning', kind: 'video-player-autoplay-requires-muted', file: page.file, field: `${block.name}.autoplay`, value: attrs.autoplay, message: 'autoplay is only safely enabled when muted is true.' })
    }

    if (attrs.preload !== undefined && !VALID_VIDEO_PRELOAD.has(String(attrs.preload))) {
      addIssue({ severity: 'warning', kind: 'video-player-invalid-preload', file: page.file, field: `${block.name}.preload`, value: attrs.preload, message: 'preload should be none, metadata, or auto.' })
    }
  }
}

function parseLegacyBeforeAfterImageLine(line) {
  const match = line.match(LEGACY_BA_IMAGE_RE)
  if (!match?.groups?.target) return null
  const target = match.groups.target.trim()
  const titleMatch = target.match(/^(?<src>.+?)\s+["'](?<title>.*)["']\s*$/)
  if (titleMatch?.groups?.src) return { src: titleMatch.groups.src.trim(), title: titleMatch.groups.title.trim() }
  return { src: target, title: '' }
}

function parseLegacyBeforeAfterMarker(value) {
  const match = value.match(LEGACY_BA_MARKER_RE)
  if (!match?.groups?.kind) return null
  return { kind: match.groups.kind, label: (match.groups.label || '').trim() }
}

function parseLegacyBeforeAfterGroup(lines, index) {
  const image = parseLegacyBeforeAfterImageLine(lines[index] || '')
  if (!image) return null
  const titleMarker = parseLegacyBeforeAfterMarker(image.title)
  if (titleMarker) return { kind: titleMarker.kind, nextIndex: index + 1, line: index + 1 }

  let markerIndex = index + 1
  let blanks = 0
  while (markerIndex < lines.length && !(lines[markerIndex] || '').trim() && blanks < 1) {
    markerIndex += 1
    blanks += 1
  }
  const marker = parseLegacyBeforeAfterMarker(lines[markerIndex] || '')
  if (!marker) return null
  return { kind: marker.kind, nextIndex: markerIndex + 1, line: index + 1 }
}

function validateLegacyBeforeAfterMarkers(page) {
  const rawBody = matter(page.raw).content.replace(/\r\n/g, '\n')
  const lines = rawBody.split('\n')
  let inFence = false
  let i = 0

  while (i < lines.length) {
    const line = lines[i] || ''
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence
      i += 1
      continue
    }
    if (inFence) {
      i += 1
      continue
    }

    const group = parseLegacyBeforeAfterGroup(lines, i)
    if (!group) {
      const marker = parseLegacyBeforeAfterMarker(line)
      if (marker) {
        addIssue({ severity: 'warning', kind: marker.kind === '전' ? 'legacy-before-after-missing-before-image' : 'legacy-before-after-orphan-after-marker', file: page.file, field: 'legacy-before-after', value: line.trim(), message: `Legacy [${marker.kind}] marker is not attached to a safe image group.` })
      }
      i += 1
      continue
    }

    if (group.kind === '후') {
      addIssue({ severity: 'warning', kind: 'legacy-before-after-orphan-after-marker', file: page.file, field: 'legacy-before-after', value: '[후]', message: 'Legacy [후] image group appeared without a preceding [전] group.' })
      i = group.nextIndex
      continue
    }

    let afterIndex = group.nextIndex
    let blanks = 0
    while (afterIndex < lines.length && !(lines[afterIndex] || '').trim()) {
      afterIndex += 1
      blanks += 1
    }
    const afterGroup = parseLegacyBeforeAfterGroup(lines, afterIndex)
    if (afterGroup?.kind === '후' && blanks <= 3) {
      i = afterGroup.nextIndex
      continue
    }

    addIssue({ severity: 'warning', kind: 'legacy-before-after-missing-after-image', file: page.file, field: 'legacy-before-after', value: '[전]', message: 'Legacy [전] image group could not be paired with a safe [후] image group.' })
    i = group.nextIndex
  }
}



function normalizeHrefToSlug(value) {
  const trimmed = String(value || '').trim()
  if (!trimmed) return ''
  if (trimmed === '/') return 'home'
  return trimmed.replace(/^\/+/, '').replace(/\/+$/, '')
}

function getSlugSet(pages) {
  const slugs = new Set()
  for (const page of pages) {
    const slug = page.frontmatter.slug
    if (isNonEmptyString(slug)) slugs.add(slug)
  }
  return slugs
}

function iterPagecardGridDirectives(raw) {
  const blocks = []
  const re = /^::pagecard-grid\s*$([\s\S]*?)^::\s*$/gm
  let match
  while ((match = re.exec(raw))) blocks.push(match[0])
  return blocks
}

function parsePagecardItemsFromBlock(block) {
  const lines = block.replace(/\r\n/g, '\n').split('\n').slice(1, -1)
  const attrs = parseDirectiveAttrs(block)
  const items = []
  const attrItems = typeof attrs.items === 'string' && attrs.items.trim()
    ? attrs.items.split(',').map((item) => item.trim()).filter(Boolean)
    : []
  items.push(...attrItems)

  let current = null
  function commit() {
    if (current && isNonEmptyString(current.href)) items.push(current.href.trim())
    current = null
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line || line === 'items:') continue

    const bullet = line.match(/^-\s*(.*)$/)
    if (bullet) {
      commit()
      const value = bullet[1].trim()
      if (/^href:/i.test(value)) current = { href: value.replace(/^href:\s*/i, '').trim() }
      else current = { href: value }
      continue
    }

    const hrefField = line.match(/^href:\s*(.*)$/i)
    if (hrefField && current) current.href = hrefField[1].trim()
  }
  commit()
  return items
}




function findDirectiveBlocks(raw, name) {
  const blocks = []
  const lines = raw.replace(/\r\n/g, '\n').split('\n')
  let inFence = false
  let i = 0

  function lineTrim(index) {
    return (lines[index] || '').trim()
  }

  while (i < lines.length) {
    const line = lines[i] || ''
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence
      i += 1
      continue
    }

    if (inFence || lineTrim(i) !== `::${name}`) {
      i += 1
      continue
    }

    if (!BODY_DIRECTIVES.has(name)) {
      let end = i + 1
      while (end < lines.length && lineTrim(end) !== '::') end += 1
      if (end < lines.length) {
        blocks.push({ raw: lines.slice(i, end + 1).join('\n'), startLine: i + 1 })
        i = end + 1
        continue
      }
      i += 1
      continue
    }

    let separator = i + 1
    while (separator < lines.length && lineTrim(separator) !== '::') separator += 1
    if (separator >= lines.length) {
      i += 1
      continue
    }

    let nestedDepth = 0
    let end = -1
    let j = separator + 1
    let foundBodyLine = false
    while (j < lines.length) {
      const t = lineTrim(j)
      if (/^::[a-z0-9-]+\s*$/.test(t)) {
        nestedDepth += 1
        foundBodyLine = true
        j += 1
        continue
      }
      if (t === '::') {
        if (nestedDepth > 0) {
          nestedDepth -= 1
          foundBodyLine = true
          j += 1
          continue
        }
        end = j
        break
      }
      if (t) foundBodyLine = true
      j += 1
    }

    if (end < 0 && !foundBodyLine) end = separator
    if (end >= 0) {
      blocks.push({ raw: lines.slice(i, end + 1).join('\n'), startLine: i + 1 })
      i = end + 1
      continue
    }

    i += 1
  }

  return blocks
}

function iterMarkdownBoxDirectives(raw) {
  return findDirectiveBlocks(raw, 'markdown-box')
}

function splitDirectiveBlock(block) {
  const lines = block.replace(/\r\n/g, '\n').split('\n')
  const inner = lines.slice(1, -1)
  const separator = inner.findIndex((line) => line.trim() === '::')
  if (separator >= 0) {
    return {
      attrLines: inner.slice(0, separator),
      bodyLines: inner.slice(separator + 1),
    }
  }
  return { attrLines: inner, bodyLines: [] }
}

function directiveBodyWithoutAttrs(block) {
  const { attrLines, bodyLines } = splitDirectiveBlock(block)
  const fallbackBodyLines = []
  for (const line of attrLines) {
    if (!/^([a-zA-Z][a-zA-Z0-9_-]*):\s*(.*)$/.test(line)) fallbackBodyLines.push(line)
  }
  return [...fallbackBodyLines, ...bodyLines].join('\n').trim()
}

function scanNestedDirectivesInMarkdownBoxBody(body) {
  const warnings = []
  const lines = body.replace(/\r\n/g, '\n').split('\n')
  let inFence = false

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] || ''
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence
      continue
    }
    if (inFence) continue

    const match = line.trim().match(/^::(?<directive>[a-zA-Z][\w-]*)\s*$/)
    const directive = match?.groups?.directive
    if (!directive) continue

    if (directive === 'markdown-box') {
      warnings.push({ code: 'nested_markdown_box', directive, line: i + 1 })
    } else if (NESTED_MARKDOWN_BOX_DIRECTIVES.has(directive)) {
      warnings.push({ code: 'nested_vue_directive_in_markdown_box', directive, line: i + 1 })
    } else {
      warnings.push({ code: 'unknown_nested_directive', directive, line: i + 1 })
    }
  }

  return warnings
}

function validateMarkdownBoxDirectives(page) {
  const blocks = iterMarkdownBoxDirectives(page.raw)

  for (const entry of blocks) {
    const block = entry.raw
    const attrs = parseDirectiveAttrs(block)
    const body = directiveBodyWithoutAttrs(block)
    const title = attrs.title

    if (!isNonEmptyString(body) && !isNonEmptyString(title)) {
      addIssue({ severity: 'warning', kind: 'markdown-box-empty', file: page.file, field: 'markdown-box', value: '', message: 'markdown-box should include a title or body.' })
    }

    if (attrs.type !== undefined && !VALID_MARKDOWN_BOX_TYPES.has(String(attrs.type))) {
      addIssue({ severity: 'warning', kind: 'markdown-box-unknown-type', file: page.file, field: 'markdown-box.type', value: attrs.type, message: `Unknown markdown-box type. Allowed values: ${Array.from(VALID_MARKDOWN_BOX_TYPES).join(', ')}` })
    }

    if (attrs.tone !== undefined && !VALID_MARKDOWN_BOX_TONES.has(String(attrs.tone))) {
      addIssue({ severity: 'warning', kind: 'markdown-box-unknown-tone', file: page.file, field: 'markdown-box.tone', value: attrs.tone, message: `Unknown markdown-box tone. Allowed values: ${Array.from(VALID_MARKDOWN_BOX_TONES).join(', ')}` })
    }

    if (attrs.collapsible !== undefined && typeof attrs.collapsible !== 'boolean') {
      addIssue({ severity: 'warning', kind: 'markdown-box-invalid-collapsible', file: page.file, field: 'markdown-box.collapsible', value: attrs.collapsible, message: 'markdown-box collapsible should be true or false.' })
    }

    if (attrs.defaultOpen !== undefined && typeof attrs.defaultOpen !== 'boolean') {
      addIssue({ severity: 'warning', kind: 'markdown-box-invalid-default-open', file: page.file, field: 'markdown-box.defaultOpen', value: attrs.defaultOpen, message: 'markdown-box defaultOpen should be true or false.' })
    }

    const nestedWarnings = scanNestedDirectivesInMarkdownBoxBody(body)
    for (const warning of nestedWarnings) {
      addIssue({
        severity: 'warning',
        kind: warning.code,
        file: page.file,
        field: 'markdown-box.body',
        value: warning.directive,
        message: `markdown-box body does not support nested directive ${warning.directive}${entry.startLine ? ` near line ${entry.startLine + warning.line}` : ''}. Use a top-level directive instead.`,
      })
    }
  }
}

function validateLegacyBoxMarkers(page) {
  const rawBody = matter(page.raw).content.replace(/\r\n/g, '\n')
  const lines = rawBody.split('\n')
  let inFence = false

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] || ''
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence
      continue
    }
    if (inFence) continue

    const match = line.match(LEGACY_BOX_CALLOUT_RE)
    if (!match?.groups?.type) continue

    const title = match.groups.title.trim()
    let hasBody = false
    let j = i + 1
    while (j < lines.length) {
      const next = lines[j] || ''
      if (!next.trim()) break
      const bodyMatch = next.match(/^\s*>\s?(.*)$/)
      if (!bodyMatch) break
      if (bodyMatch[1].trim()) hasBody = true
      j += 1
    }

    if (!title && !hasBody) {
      addIssue({ severity: 'warning', kind: 'legacy-box-empty', file: page.file, field: 'legacy-markdown-box', value: line.trim(), message: 'Legacy box callout has no title or body.' })
    }
  }
}


function iterGalleryStripDirectives(raw) {
  return findDirectiveBlocks(raw, 'gallery-strip')
}

function parseGalleryStripItemsFromBody(body) {
  return body
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .filter((line) => /^[-*+]\s+/.test(line))
    .map((line) => line.replace(/^[-*+]\s+/, '').trim())
    .map((line) => {
      const [src = '', caption = '', thumb = '', metaText = ''] = line.split('|').map((part) => part.trim())
      return { src, caption, thumb, metaText }
    })
    .filter((item) => item.src.length > 0)
}


function validateGalleryStripMeta(page, metaText) {
  if (!metaText) return
  const chunks = String(metaText).split(';').map((part) => part.trim()).filter(Boolean)
  for (const chunk of chunks) {
    const eq = chunk.indexOf('=')
    if (eq <= 0) {
      addIssue({ severity: 'warning', kind: 'gallery-strip-invalid-meta', file: page.file, field: 'gallery-strip.meta', value: chunk, message: 'gallery-strip metadata should use key=value entries separated by semicolons.' })
      continue
    }
    const key = chunk.slice(0, eq).trim()
    const value = chunk.slice(eq + 1).trim()
    if (!/^[a-zA-Z][\w-]*$/.test(key) || !value) {
      addIssue({ severity: 'warning', kind: 'gallery-strip-invalid-meta', file: page.file, field: 'gallery-strip.meta', value: chunk, message: 'gallery-strip metadata key must be non-empty and value should not be empty.' })
    }
    if (key === 'title' && value.length > 120) {
      addIssue({ severity: 'warning', kind: 'gallery-strip-title-too-long', file: page.file, field: 'gallery-strip.meta.title', value, message: 'gallery-strip metadata title is unusually long.' })
    }
  }
}

function validateGalleryStripDirectives(page) {
  const blocks = iterGalleryStripDirectives(page.raw)

  for (const entry of blocks) {
    const attrs = parseDirectiveAttrs(entry.raw)
    const body = directiveBodyWithoutAttrs(entry.raw)
    const items = parseGalleryStripItemsFromBody(body)

    if (!items.length) {
      addIssue({ severity: 'warning', kind: 'gallery-strip-missing-items', file: page.file, field: 'gallery-strip', value: '', message: 'gallery-strip should include one or more item lines.' })
    }

    if (attrs.layout !== undefined && !VALID_GALLERY_LAYOUTS.has(String(attrs.layout))) {
      addIssue({ severity: 'warning', kind: 'gallery-strip-invalid-layout', file: page.file, field: 'gallery-strip.layout', value: attrs.layout, message: 'gallery-strip layout should be strip, grid, or compact.' })
    }

    if (attrs.lightbox !== undefined && typeof attrs.lightbox !== 'boolean') {
      addIssue({ severity: 'warning', kind: 'gallery-strip-invalid-lightbox', file: page.file, field: 'gallery-strip.lightbox', value: attrs.lightbox, message: 'gallery-strip lightbox should be true or false.' })
    }

    for (const item of items) {
      validateResolvedAsset(page, 'gallery-strip.src', item.src, { required: true, missingSeverity: 'warning' })
      if (item.thumb) validateResolvedAsset(page, 'gallery-strip.thumb', item.thumb, { required: false, missingSeverity: 'warning' })
      validateGalleryStripMeta(page, item.metaText)
    }
  }
}

function validatePagecardGridDirectives(page, slugSet) {
  const blocks = iterPagecardGridDirectives(page.raw)

  for (const block of blocks) {
    const attrs = parseDirectiveAttrs(block)
    const items = parsePagecardItemsFromBlock(block)
    const hasQuerySource = isNonEmptyString(attrs.query) || isNonEmptyString(attrs.tag) || isNonEmptyString(attrs.section) || attrs.featured === true

    if (!items.length && !hasQuerySource) {
      addIssue({ severity: 'error', kind: 'pagecard-grid-missing-source', file: page.file, field: 'pagecard-grid', value: '', message: 'pagecard-grid requires items, query, tag, section, or featured: true.' })
    }

    for (const href of items) {
      if (!PAGECARD_HREF_RE.test(href)) {
        addIssue({ severity: 'warning', kind: 'pagecard-grid-invalid-href', file: page.file, field: 'pagecard-grid.items', value: href, message: 'pagecard-grid item href should be an internal absolute path such as /tools/wiper.' })
        continue
      }
      const slug = normalizeHrefToSlug(href)
      if (!slugSet.has(slug)) {
        addIssue({ severity: 'warning', kind: 'pagecard-grid-unresolved-href', file: page.file, field: 'pagecard-grid.items', value: href, message: `pagecard-grid item does not resolve to a known content page: ${href}` })
      }
    }

    if (attrs.limit !== undefined) {
      const limit = Number(attrs.limit)
      if (!Number.isFinite(limit)) {
        addIssue({ severity: 'warning', kind: 'pagecard-grid-invalid-limit', file: page.file, field: 'pagecard-grid.limit', value: attrs.limit, message: 'pagecard-grid limit should be a finite number.' })
      } else if (limit < 1 || limit > 24) {
        addIssue({ severity: 'warning', kind: 'pagecard-grid-limit-clamped', file: page.file, field: 'pagecard-grid.limit', value: attrs.limit, message: 'pagecard-grid limit will be clamped to 1..24.' })
      }
    }

    if (attrs.columns !== undefined && !['auto', 'compact', 'wide'].includes(String(attrs.columns))) {
      addIssue({ severity: 'warning', kind: 'pagecard-grid-invalid-columns', file: page.file, field: 'pagecard-grid.columns', value: attrs.columns, message: 'pagecard-grid columns should be auto, compact, or wide.' })
    }

    if (attrs.sort !== undefined && !['manual', 'title', 'order', 'date'].includes(String(attrs.sort))) {
      addIssue({ severity: 'warning', kind: 'pagecard-grid-invalid-sort', file: page.file, field: 'pagecard-grid.sort', value: attrs.sort, message: 'pagecard-grid sort should be manual, title, order, or date.' })
    }
  }
}

function validateLegacyPagecardMarkers(page) {
  const rawBody = matter(page.raw).content.replace(/\r\n/g, '\n')
  const lines = rawBody.split('\n')
  let inFence = false

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] || ''
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence
      continue
    }
    if (inFence) continue

    const wiki = line.match(PAGECARD_BLOCKQUOTE_WIKILINK_RE)
    if (wiki?.groups?.href && !PAGECARD_HREF_RE.test(wiki.groups.href.trim())) {
      addIssue({ severity: 'warning', kind: 'legacy-pagecard-invalid-href', file: page.file, field: 'legacy-pagecards', value: wiki.groups.href, message: 'Legacy pagecard wikilink href is not a supported internal route.' })
    }

    if (PAGECARD_CALLOUT_RE.test(line) || PAGECARD_LIST_MARKER_RE.test(line)) {
      const next = lines[i + 1] || ''
      const hasNext = PAGECARD_HREF_RE.test(next.replace(/^\s*>\s*/, '').replace(/^\s*-\s*/, '').trim())
      if (!hasNext) {
        addIssue({ severity: 'warning', kind: 'legacy-pagecard-empty-group', file: page.file, field: 'legacy-pagecards', value: line.trim(), message: 'Legacy pagecard marker has no immediately following href entries.' })
      }
    }
  }
}

function validateRelated(pages) {
  const bySlug = new Map()
  for (const page of pages) {
    const slug = page.frontmatter.slug
    if (isNonEmptyString(slug)) bySlug.set(slug, page)
  }
  for (const page of pages) {
    const related = page.frontmatter.related
    if (!Array.isArray(related)) continue
    const selfSlug = page.frontmatter.slug
    for (const slug of related) {
      if (slug === selfSlug) {
        addIssue({ severity: 'warning', kind: 'self-related-slug', file: page.file, field: 'related', value: slug, message: 'Page relates to itself. This is usually not useful.' })
        continue
      }
      const target = bySlug.get(slug)
      if (!target) {
        addIssue({ severity: 'error', kind: 'missing-related-slug', file: page.file, field: 'related', value: slug, message: `Unknown related slug: ${slug}` })
        continue
      }
      if (target.frontmatter.status === 'archived' || target.frontmatter.visibility === 'hidden') {
        addIssue({ severity: 'warning', kind: 'related-hidden-or-archived', file: page.file, field: 'related', value: slug, message: `Related slug points to hidden or archived page: ${slug}` })
      }
    }
  }
}

function validateCanonical(page) {
  const value = page.frontmatter.canonical
  if (value === undefined || value === null || value === '') return
  if (typeof value !== 'string' || /\s/.test(value)) {
    addIssue({ severity: 'error', kind: 'invalid-canonical', file: page.file, field: 'canonical', value, message: 'canonical must be a string without whitespace.' })
  }
}

function validateSeoFields(page) {
  const description = page.frontmatter.seoDescription || page.frontmatter.ogDescription || page.frontmatter.summary || page.frontmatter.description
  const title = page.frontmatter.seoTitle || page.frontmatter.ogTitle || page.frontmatter.title
  if (!isNonEmptyString(title)) {
    addIssue({ severity: 'warning', kind: 'seo-missing-title', file: page.file, field: 'title', value: title, message: 'SEO title falls back to site default.' })
  }
  if (!isNonEmptyString(description)) {
    addIssue({ severity: 'warning', kind: 'seo-missing-description', file: page.file, field: 'description', value: description, message: 'SEO description falls back to site default.' })
  }
  if (typeof title === 'string' && title.length > 80) {
    addIssue({ severity: 'warning', kind: 'seo-title-long', file: page.file, field: 'title', value: title, message: 'SEO title is longer than 80 characters.' })
  }
  if (typeof description === 'string' && description.length > 180) {
    addIssue({ severity: 'warning', kind: 'seo-description-long', file: page.file, field: 'description', value: description, message: 'SEO description is longer than 180 characters.' })
  }
  for (const field of ['seoTitle', 'seoDescription', 'ogTitle', 'ogDescription']) {
    if (page.frontmatter[field] === '') {
      addIssue({ severity: 'warning', kind: 'empty-seo-field', file: page.file, field, value: page.frontmatter[field], message: `${field} is present but empty. Remove it or fill it.` })
    }
  }
  validateCanonical(page)
  if (page.frontmatter.status === 'draft' && page.frontmatter.robots === 'index,follow') {
    addIssue({ severity: 'warning', kind: 'draft-indexed', file: page.file, field: 'robots', value: page.frontmatter.robots, message: 'Draft page explicitly uses index,follow.' })
  }
}


function validateSiteSeoDefaults() {
  if (SITE_ORIGIN !== 'https://varun.tools') {
    addIssue({ severity: 'error', kind: 'site-origin-invalid', file: path.join(projectRoot, 'index.html'), field: 'origin', value: SITE_ORIGIN, message: 'Site origin must be https://varun.tools.' })
  }
  const defaultOg = resolveFilesystemAsset({
    source: DEFAULT_OG_IMAGE,
    contentFilePath: path.join(contentRoot, 'home', 'index.md'),
    projectRoot,
    contentRoot,
    publicRoot,
  })
  if (!defaultOg.found) {
    addIssue({ severity: 'error', kind: 'site-default-og-missing', file: path.join(projectRoot, 'index.html'), field: 'defaultOgImage', value: DEFAULT_OG_IMAGE, message: 'Default OG image is missing.' })
  }
}


function validateStringArrayObjectField(page, objectName, objectValue, field) {
  const value = objectValue[field]
  if (value === undefined || value === null) return
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !item.trim())) {
    addIssue({ severity: 'warning', kind: 'invalid-array-field', file: page.file, field: `${objectName}.${field}`, value, message: `${objectName}.${field} should be an array of non-empty strings.` })
  }
}

function validateWorkFields(page) {
  const work = page.frontmatter.work
  if (work === undefined || work === null) return

  if (!isPlainObject(work)) {
    addIssue({ severity: 'warning', kind: 'invalid-work-field', file: page.file, field: 'work', value: work, message: 'work should be an object.' })
    return
  }

  if (work.type !== undefined && !VALID_WORK_TYPES.has(String(work.type))) {
    addIssue({ severity: 'warning', kind: 'invalid-work-type', file: page.file, field: 'work.type', value: work.type, message: `work.type should be one of ${Array.from(VALID_WORK_TYPES).join(', ')}.` })
  }
  if (work.status !== undefined && !VALID_WORK_STATUSES.has(String(work.status))) {
    addIssue({ severity: 'warning', kind: 'invalid-work-status', file: page.file, field: 'work.status', value: work.status, message: `work.status should be one of ${Array.from(VALID_WORK_STATUSES).join(', ')}.` })
  }
  if (work.featured !== undefined && typeof work.featured !== 'boolean') {
    addIssue({ severity: 'warning', kind: 'invalid-boolean-field', file: page.file, field: 'work.featured', value: work.featured, message: 'work.featured should be a boolean.' })
  }
  if (work.weight !== undefined && typeof work.weight !== 'number') {
    addIssue({ severity: 'warning', kind: 'invalid-number-field', file: page.file, field: 'work.weight', value: work.weight, message: 'work.weight should be a number.' })
  }
  if (work.year !== undefined && typeof work.year !== 'number') {
    addIssue({ severity: 'warning', kind: 'invalid-number-field', file: page.file, field: 'work.year', value: work.year, message: 'work.year should be a number.' })
  }
  for (const field of ['role', 'stack', 'tools', 'tags']) validateStringArrayObjectField(page, 'work', work, field)
  for (const field of ['period', 'client', 'category', 'summary']) {
    if (work[field] !== undefined && typeof work[field] !== 'string') {
      addIssue({ severity: 'warning', kind: 'invalid-string-field', file: page.file, field: `work.${field}`, value: work[field], message: `work.${field} should be a string.` })
    }
  }
  if (work.mood !== undefined && !isPlainObject(work.mood)) {
    addIssue({ severity: 'warning', kind: 'invalid-work-mood', file: page.file, field: 'work.mood', value: work.mood, message: 'work.mood should be an object.' })
  }
  if (work.links !== undefined && !isPlainObject(work.links)) {
    addIssue({ severity: 'warning', kind: 'invalid-work-links', file: page.file, field: 'work.links', value: work.links, message: 'work.links should be an object.' })
  }
}

function printReport(pages) {
  const errors = issues.filter((issue) => issue.severity === 'error')
  const warnings = issues.filter((issue) => issue.severity === 'warning')
  if (!issues.length) {
    console.log('[VARUNTOOLS][content-validation] OK')
    console.log(`Checked ${pages.length} markdown pages.`)
    console.log('0 errors, 0 warnings.')
    return
  }
  const label = errors.length ? 'FAILED' : 'OK_WITH_WARNINGS'
  console.log(`[VARUNTOOLS][content-validation] ${label}`)
  console.log(`Checked ${pages.length} markdown pages.`)
  console.log(`${errors.length} errors, ${warnings.length} warnings.`)
  console.log('')
  for (const issue of issues) {
    console.log(`${issue.severity.toUpperCase()} ${issue.kind}`)
    console.log(`  file: ${issue.file}`)
    if (issue.field) console.log(`  field: ${issue.field}`)
    if (issue.value !== undefined) console.log(`  value: ${String(issue.value)}`)
    console.log(`  message: ${issue.message}`)
    console.log('')
  }
}

const files = walkMarkdownIndexFiles(contentRoot)
const pages = files.map(parseMarkdownFile)
const slugSet = getSlugSet(pages)

for (const page of pages) {
  validateRequiredFields(page)
  validateSlugFormat(page)
  validateEnums(page)
  validatePrimitiveFields(page)
  validateProductFields(page)
  validateWorkFields(page)
  validateDates(page)
  validateAssets(page)
  validateSeoFields(page)
  validateCaptionedImages(page)
  validateBeforeAfterDirectives(page)
  validateVideoPlayerDirectives(page)
  validatePagecardGridDirectives(page, slugSet)
  validateMarkdownBoxDirectives(page)
  validateGalleryStripDirectives(page)
  validateLegacyBeforeAfterMarkers(page)
  validateLegacyPagecardMarkers(page)
  validateLegacyBoxMarkers(page)
}

validateDuplicateSlugs(pages)
validateRelated(pages)
printReport(pages)

if (issues.some((issue) => issue.severity === 'error')) process.exit(1)
