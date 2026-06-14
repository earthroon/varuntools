#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const productsRoot = path.join(root, 'src/content/pages/products')
const manifestName = 'product.manifest.json'
const allowedDeliveryModes = new Set(['post-purchase', 'manual', 'none', 'external'])
const allowedDeliveryProviders = new Set(['cloudflare-r2', 'manual', 'none', 'external'])
const allowedProductTypes = new Set(['physical', 'digital', 'service', 'bundle', 'external'])
const allowedProductStatuses = new Set(['draft', 'coming-soon', 'available', 'sold-out', 'hidden'])
const allowedVisibility = new Set(['public', 'hidden'])
const skipProductDirs = new Set(['categories'])

const errors = []
const warnings = []
const notes = []

function rel(file) {
  return path.relative(root, file).replaceAll(path.sep, '/')
}

function addError(code, message) { errors.push({ code, message }) }
function addWarning(code, message) { warnings.push({ code, message }) }
function addNote(code, message) { notes.push({ code, message }) }

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch (error) {
    addError('manifest-invalid-json', `${rel(file)} is invalid JSON: ${error.message}`)
    return null
  }
}

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

function assertRelativeAsset(productDir, manifestPath, label, assetPath, { required = true } = {}) {
  if (!assetPath) {
    if (required) addError('asset-missing', `${rel(manifestPath)} assets.${label} is required.`)
    return
  }
  if (typeof assetPath !== 'string') {
    addError('asset-invalid', `${rel(manifestPath)} assets.${label} must be a string path.`)
    return
  }
  if (/^https?:\/\//.test(assetPath)) {
    addWarning('asset-external', `${rel(manifestPath)} assets.${label} is external. Prefer local product assets for launch QA.`)
    return
  }
  const resolved = path.resolve(productDir, assetPath)
  if (!resolved.startsWith(productDir)) {
    addError('asset-path-escapes-product', `${rel(manifestPath)} assets.${label} escapes the product directory: ${assetPath}`)
    return
  }
  if (!existsSync(resolved)) addError('asset-file-missing', `${rel(manifestPath)} assets.${label} does not exist: ${assetPath}`)
}

function validateManifest(productDir, slug, manifest) {
  const manifestPath = path.join(productDir, manifestName)
  if (!manifest) return

  if (manifest.schemaVersion !== 1) addError('manifest-schema-version', `${rel(manifestPath)} schemaVersion must be 1.`)
  if (manifest.slug !== slug) addError('manifest-slug-mismatch', `${rel(manifestPath)} slug must match folder name: ${slug}.`)
  if (!manifest.title) addError('manifest-title-missing', `${rel(manifestPath)} title is required.`)
  if (!manifest.sku) addError('manifest-sku-missing', `${rel(manifestPath)} sku is required.`)
  if (typeof manifest.isDemo !== 'boolean') addError('manifest-is-demo-missing', `${rel(manifestPath)} isDemo must be true or false.`)
  if (!allowedProductStatuses.has(String(manifest.status || ''))) addError('manifest-status-invalid', `${rel(manifestPath)} status must be one of ${[...allowedProductStatuses].join(', ')}.`)
  if (!allowedVisibility.has(String(manifest.visibility || ''))) addError('manifest-visibility-invalid', `${rel(manifestPath)} visibility must be public or hidden.`)

  const product = manifest.product || {}
  if (!allowedProductTypes.has(String(product.type || ''))) addError('manifest-product-type-invalid', `${rel(manifestPath)} product.type is required and must be a known type.`)
  if (!product.category) addError('manifest-category-missing', `${rel(manifestPath)} product.category is required.`)
  if (!product.collection) addWarning('manifest-collection-missing', `${rel(manifestPath)} product.collection is recommended.`)

  const assets = manifest.assets || {}
  assertRelativeAsset(productDir, manifestPath, 'cover', assets.cover)
  assertRelativeAsset(productDir, manifestPath, 'thumbnail', assets.thumbnail)
  assertRelativeAsset(productDir, manifestPath, 'ogImage', assets.ogImage)
  if (Array.isArray(assets.gallery)) {
    for (const [index, item] of assets.gallery.entries()) assertRelativeAsset(productDir, manifestPath, `gallery[${index}]`, item, { required: false })
  }

  const delivery = manifest.delivery || {}
  const mode = String(delivery.mode || '')
  const provider = String(delivery.provider || '')
  if (!allowedDeliveryModes.has(mode)) addError('delivery-mode-invalid', `${rel(manifestPath)} delivery.mode must be one of ${[...allowedDeliveryModes].join(', ')}.`)
  if (!allowedDeliveryProviders.has(provider)) addError('delivery-provider-invalid', `${rel(manifestPath)} delivery.provider must be one of ${[...allowedDeliveryProviders].join(', ')}.`)
  if (provider === 'cloudflare-r2') {
    if (mode !== 'post-purchase') addError('cloudflare-delivery-mode-invalid', `${rel(manifestPath)} Cloudflare R2 delivery must use delivery.mode=post-purchase.`)
    if (delivery.access !== 'private') addError('cloudflare-delivery-access-invalid', `${rel(manifestPath)} Cloudflare R2 delivery must use delivery.access=private.`)
    if (!delivery.r2?.bucketBinding) addError('cloudflare-bucket-binding-missing', `${rel(manifestPath)} delivery.r2.bucketBinding is required for Cloudflare R2.`)
    if (!delivery.r2?.keyPrefix) addError('cloudflare-key-prefix-missing', `${rel(manifestPath)} delivery.r2.keyPrefix is required for Cloudflare R2.`)
  }
  if ('publicUrl' in delivery || 'downloadUrl' in delivery) addError('public-download-url-forbidden', `${rel(manifestPath)} must not expose delivery.publicUrl or delivery.downloadUrl for post-purchase delivery.`)

  const deliverables = Array.isArray(delivery.deliverables) ? delivery.deliverables : []
  if (!Array.isArray(delivery.deliverables)) addError('deliverables-invalid', `${rel(manifestPath)} delivery.deliverables must be an array.`)
  for (const [index, item] of deliverables.entries()) {
    if (!item || typeof item !== 'object') {
      addError('deliverable-invalid', `${rel(manifestPath)} delivery.deliverables[${index}] must be an object.`)
      continue
    }
    if (!item.id) addError('deliverable-id-missing', `${rel(manifestPath)} delivery.deliverables[${index}].id is required.`)
    if (!item.label) addWarning('deliverable-label-missing', `${rel(manifestPath)} delivery.deliverables[${index}].label is recommended.`)
    if (provider === 'cloudflare-r2' && !item.r2Key) addError('deliverable-r2-key-missing', `${rel(manifestPath)} delivery.deliverables[${index}].r2Key is required for Cloudflare R2.`)
    if (item.publicUrl || item.url || item.href) addError('deliverable-public-link-forbidden', `${rel(manifestPath)} delivery.deliverables[${index}] must not expose public URL fields.`)
  }
  if (product.type === 'digital' && !manifest.isDemo && provider === 'cloudflare-r2' && deliverables.length === 0) {
    addError('digital-deliverables-missing', `${rel(manifestPath)} real digital products using Cloudflare R2 need at least one private deliverable.`)
  }

  const checkoutUrl = manifest.checkout?.checkoutUrl || ''
  if (manifest.launch?.readyForCheckout === true && !checkoutUrl) addError('ready-for-checkout-without-url', `${rel(manifestPath)} launch.readyForCheckout=true requires checkout.checkoutUrl.`)
  if (manifest.launch?.readyForCatalog === true) {
    if (!assets.cover || !assets.thumbnail || !assets.ogImage) addError('ready-for-catalog-assets-missing', `${rel(manifestPath)} launch.readyForCatalog=true requires cover, thumbnail, and ogImage.`)
  }

  const indexPath = path.join(productDir, 'index.md')
  if (!existsSync(indexPath)) addError('product-index-missing', `${rel(productDir)} must contain index.md.`)
  else {
    const frontmatter = parseFrontmatter(readFileSync(indexPath, 'utf8'))
    if (frontmatter.kind !== 'product') addWarning('product-index-kind', `${rel(indexPath)} should use kind: product.`)
    if (frontmatter.slug && frontmatter.slug !== `products/${slug}`) addError('product-index-slug-mismatch', `${rel(indexPath)} slug must be products/${slug}.`)
    const raw = readFileSync(indexPath, 'utf8')
    if (manifest.sku && !raw.includes(String(manifest.sku))) addWarning('sku-not-visible-in-index', `${rel(indexPath)} does not appear to include manifest sku ${manifest.sku}.`)
  }
}

function listProductDirs() {
  if (!existsSync(productsRoot)) return []
  return readdirSync(productsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !skipProductDirs.has(entry.name))
    .map((entry) => path.join(productsRoot, entry.name))
    .filter((dir) => existsSync(path.join(dir, 'index.md')) || existsSync(path.join(dir, 'page.csv')) || existsSync(path.join(dir, manifestName)))
    .sort()
}

const skuMap = new Map()
for (const productDir of listProductDirs()) {
  const slug = path.basename(productDir)
  const manifestPath = path.join(productDir, manifestName)
  if (!existsSync(manifestPath)) {
    addError('manifest-missing', `${rel(productDir)} is missing ${manifestName}.`)
    continue
  }
  const manifest = readJson(manifestPath)
  if (manifest?.sku) {
    if (skuMap.has(manifest.sku)) addError('sku-duplicate', `${rel(manifestPath)} duplicates sku ${manifest.sku} from ${rel(skuMap.get(manifest.sku))}.`)
    else skuMap.set(manifest.sku, manifestPath)
  }
  validateManifest(productDir, slug, manifest)
}

if (!listProductDirs().length) addWarning('no-product-packages', 'No product package directories were found.')

console.log('Product Upload Audit')
console.log('')
console.log(`products: ${listProductDirs().length}`)
console.log(`errors: ${errors.length}`)
console.log(`warnings: ${warnings.length}`)
console.log(`notes: ${notes.length}`)
for (const item of errors) console.error(`ERROR [${item.code}] ${item.message}`)
for (const item of warnings) console.warn(`WARN  [${item.code}] ${item.message}`)
for (const item of notes) console.log(`NOTE  [${item.code}] ${item.message}`)

if (errors.length) {
  console.error('[audit:product-upload] FAILED')
  process.exit(1)
}
console.log('[audit:product-upload] OK product upload manifests are valid')
