#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import process from 'node:process'

const requiredFiles = [
  'src/types/productEntitlements.ts',
  'src/utils/productEntitlements.ts',
  'src/components/markdown/ProductVariantSelector.vue',
  'src/markdown/directives/productVariantDirective.ts',
  'workers/delivery/src/variantEntitlements.ts',
  'workers/delivery/migrations/0003_variant_bundle_entitlements.sql',
  'workers/admin-api/src/opsEntitlements.ts',
  'scripts/smoke-product-variant-bundle.mjs',
  'docs/authoring/product-variant-bundle.md',
  'docs/ops/variant-bundle-ledger.md',
  'docs/migration/commit-79.md',
]

const requiredTokens = {
  'src/content/pages/products/spec-playground/product.manifest.json': ['variants', 'bundles', 'deliverableSets', 'deliverableSetId', 'personal', 'commercial'],
  'src/content/pages/products/spec-playground/index.md': ['hasVariants', 'defaultVariantId', 'licenseScope', 'checkoutMode'],
  'workers/delivery/src/variantEntitlements.ts': ['variantId', 'bundleId', 'deliverableSetId', 'entitlementScope', 'GRANT_DELIVERABLE_MISMATCH'],
  'workers/delivery/src/paymentActivation.ts': ['resolvePaymentEntitlement', 'variantId', 'bundleId', 'entitlementScopeJson'],
  'workers/delivery/src/grants.ts': ['parseGrantEntitlementScope', 'entitlement_scope_json', 'GRANT_DELIVERABLE_MISMATCH'],
  'workers/delivery/migrations/0003_variant_bundle_entitlements.sql': ['variant_id', 'bundle_id', 'entitlement_scope_json', 'license_scope'],
  'scripts/product-sync.mjs': ['deliverableSets', 'bundle-variant-ref-missing', 'active-variant-checkout-disabled', 'deliverableSetId'],
  'admin/src/types/admin.ts': ['variantId', 'bundleId', 'licenseScope', 'variantCount', 'bundleCount'],
  'docs/authoring/product-variant-bundle.md': ['variant', 'bundle', 'deliverableSet', 'entitlement_scope_json'],
}

const forbiddenPublicTokens = {
  'src/content/pages/products/spec-playground/index.md': ['r2Key:', 'privatePath:', 'deliverableSetId:', 'deliverableIds:', 'entitlement_scope_json'],
  'src/components/markdown/ProductVariantSelector.vue': ['r2Key', 'privatePath', 'deliverableSetId', 'deliverableIds', 'entitlement_scope_json'],
}

let failed = false
function fail(message) {
  console.error(`[smoke:product-variant-bundle] FAIL ${message}`)
  failed = true
}

for (const file of requiredFiles) {
  if (!existsSync(file)) fail(`missing ${file}`)
}

for (const [file, tokens] of Object.entries(requiredTokens)) {
  if (!existsSync(file)) { fail(`missing token file ${file}`); continue }
  const text = readFileSync(file, 'utf8')
  for (const token of tokens) if (!text.includes(token)) fail(`${file} missing token ${token}`)
}

for (const [file, tokens] of Object.entries(forbiddenPublicTokens)) {
  if (!existsSync(file)) continue
  const text = readFileSync(file, 'utf8')
  for (const token of tokens) if (text.includes(token)) fail(`${file} must not expose ${token}`)
}

const paymentActivation = existsSync('workers/delivery/src/paymentActivation.ts') ? readFileSync('workers/delivery/src/paymentActivation.ts', 'utf8') : ''
if (/defaultVariantId/.test(paymentActivation)) fail('payment activation must not silently default variantId')
if (/orderName.*productSlug/.test(paymentActivation)) fail('payment activation must not infer productSlug from orderName')

const adminApi = existsSync('workers/admin-api/src/index.ts') ? readFileSync('workers/admin-api/src/index.ts', 'utf8') : ''
if (/paymentKey\s*[:=]\s*['"][^*]/.test(adminApi)) fail('admin api must not fixture raw paymentKey')

if (failed) process.exit(1)
console.log('[smoke:product-variant-bundle] OK variant/bundle entitlement boundary verified')
