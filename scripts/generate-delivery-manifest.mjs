#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const productsRoot = path.join(root, 'src/content/pages/products')
const outFile = path.join(root, 'workers/delivery/src/generated/product-delivery-manifest.json')
const skip = new Set(['categories'])

function rel(file) {
  return path.relative(root, file).replaceAll(path.sep, '/')
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'))
}

function safeDeliverable(item) {
  return {
    id: String(item.id),
    label: String(item.label || item.id),
    fileName: item.fileName ? String(item.fileName) : '',
    contentType: item.contentType ? String(item.contentType) : 'application/octet-stream',
    sizeBytes: Number.isFinite(Number(item.sizeBytes)) ? Number(item.sizeBytes) : null,
    r2Key: String(item.r2Key || ''),
  }
}

function safeVariant(item) {
  return {
    id: String(item.id || ''),
    label: String(item.label || item.id || ''),
    status: String(item.status || 'draft'),
    licenseScope: item.licenseScope ? String(item.licenseScope) : '',
    price: Number.isFinite(Number(item.price)) ? Number(item.price) : null,
    currency: item.currency ? String(item.currency) : '',
    checkoutMode: item.checkoutMode ? String(item.checkoutMode) : '',
    checkoutUrl: item.checkoutUrl ? String(item.checkoutUrl) : '',
    deliverableSetId: item.deliverableSetId ? String(item.deliverableSetId) : '',
    default: Boolean(item.default),
  }
}

function safeDeliverableSet(item) {
  return {
    id: String(item.id || ''),
    label: String(item.label || item.id || ''),
    deliverableIds: Array.isArray(item.deliverableIds) ? item.deliverableIds.map(String).filter(Boolean) : [],
  }
}

function safeBundle(item) {
  return {
    id: String(item.id || ''),
    label: String(item.label || item.id || ''),
    status: String(item.status || 'draft'),
    productSlugs: Array.isArray(item.productSlugs) ? item.productSlugs.map(String).filter(Boolean) : [],
    variantRefs: Array.isArray(item.variantRefs) ? item.variantRefs.map((ref) => ({ productSlug: String(ref.productSlug || ''), variantId: String(ref.variantId || '') })).filter((ref) => ref.productSlug && ref.variantId) : [],
    price: Number.isFinite(Number(item.price)) ? Number(item.price) : null,
    currency: item.currency ? String(item.currency) : '',
    checkoutMode: item.checkoutMode ? String(item.checkoutMode) : '',
    checkoutUrl: item.checkoutUrl ? String(item.checkoutUrl) : '',
  }
}

function loadProducts() {
  if (!existsSync(productsRoot)) return []
  return readdirSync(productsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !skip.has(entry.name))
    .map((entry) => ({ slug: entry.name, dir: path.join(productsRoot, entry.name) }))
    .filter(({ dir }) => existsSync(path.join(dir, 'product.manifest.json')))
    .map(({ slug, dir }) => {
      const source = path.join(dir, 'product.manifest.json')
      const manifest = readJson(source)
      const delivery = manifest.delivery || {}
      const r2 = delivery.r2 || {}
      return {
        slug,
        sku: String(manifest.product?.sku || manifest.sku || ''),
        title: String(manifest.title || slug),
        isDemo: Boolean(manifest.launch?.isDemo ?? manifest.isDemo),
        status: String(manifest.product?.status || manifest.status || ''),
        visibility: String(manifest.launch?.visibility || manifest.visibility || ''),
        checkout: {
          provider: String(manifest.checkout?.provider || 'none'),
          mode: String(manifest.checkout?.mode || 'disabled'),
        },
        delivery: {
          mode: String(delivery.mode || ''),
          provider: String(delivery.provider || ''),
          access: String(delivery.access || ''),
          bucketBinding: String(r2.bucketBinding || ''),
          keyPrefix: String(r2.keyPrefix || ''),
          deliverables: Array.isArray(delivery.deliverables) ? delivery.deliverables.map(safeDeliverable) : [],
        },
        variants: Array.isArray(manifest.variants) ? manifest.variants.map(safeVariant).filter((variant) => variant.id) : [],
        deliverableSets: Array.isArray(manifest.deliverableSets) ? manifest.deliverableSets.map(safeDeliverableSet).filter((set) => set.id) : [],
        bundles: Array.isArray(manifest.bundles) ? manifest.bundles.map(safeBundle).filter((bundle) => bundle.id) : [],
        launch: {
          readyForCatalog: Boolean(manifest.launch?.readyForCatalog),
          readyForCheckout: Boolean(manifest.launch?.readyForCheckout),
        },
        source: rel(source),
      }
    })
    .sort((a, b) => a.slug.localeCompare(b.slug))
}

const products = loadProducts()
const payload = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  warning: 'Worker-only generated manifest. Do not publish this file to public/. It may include private R2 keys.',
  products,
}

mkdirSync(path.dirname(outFile), { recursive: true })
writeFileSync(outFile, `${JSON.stringify(payload, null, 2)}\n`)
console.log(`[generate:delivery-manifest] wrote ${rel(outFile)} with ${products.length} product packages`)
