#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const failures = []
function file(rel) { return path.join(root, rel) }
function read(rel) { return readFileSync(file(rel), 'utf8') }
function requireFile(rel) { if (!existsSync(file(rel))) failures.push(`missing file: ${rel}`) }
function requireText(rel, text) { if (!read(rel).includes(text)) failures.push(`${rel} missing ${text}`) }
function forbidText(rel, text) { if (read(rel).includes(text)) failures.push(`${rel} must not contain ${text}`) }

const required = [
  'src/utils/checkoutHandoff.ts',
  'src/utils/productAction.ts',
  'src/types/content.ts',
  'src/components/markdown/ProductDetailCta.vue',
  'src/components/markdown/ProductCard.vue',
  'src/content/pages/checkout/success/index.md',
  'src/content/pages/checkout/fail/index.md',
  'docs/authoring/checkout-handoff.md',
  'docs/migration/commit-73.md',
]
for (const rel of required) requireFile(rel)

for (const token of ['checkoutProvider', 'checkoutMode', 'checkoutUrl', 'successUrl', 'failUrl', 'claimRedirect']) {
  requireText('src/types/content.ts', token)
  requireText('src/utils/checkoutHandoff.ts', token)
  requireText('src/utils/productAction.ts', token)
  requireText('docs/authoring/checkout-handoff.md', token)
  requireText('docs/migration/commit-73.md', token)
}

for (const token of ['toss-ready', 'external-checkout', 'manual-inquiry', 'disabled', 'frontend-handoff-only']) {
  requireText('src/utils/checkoutHandoff.ts', token)
}
requireText('src/utils/productAction.ts', 'normalizeCheckoutHandoff')
requireText('src/components/markdown/ProductDetailCta.vue', 'trustBoundaryNotice')
requireText('src/content/pages/checkout/success/index.md', 'Payment success screens do not prove purchase rights')
requireText('src/content/pages/checkout/success/index.md', '/claim')
requireText('docs/authoring/checkout-handoff.md', 'webhook')
requireText('docs/authoring/checkout-handoff.md', 'grant')
requireText('scripts/validate-content.mjs', 'VALID_PRODUCT_CHECKOUT_MODES')
requireText('scripts/validate-content.mjs', 'product-checkout-mode-provider-mismatch')
requireText('scripts/check-launch.mjs', 'smoke:checkout-handoff')
requireText('package.json', 'smoke:checkout-handoff')

forbidText('src/content/pages/checkout/success/index.md', 'download available')
forbidText('src/content/pages/checkout/success/index.md', 'grant created')
forbidText('src/components/markdown/ProductDetailCta.vue', 'purchase_grants')
forbidText('src/utils/productAction.ts', 'webhook_events')
forbidText('src/utils/checkoutHandoff.ts', 'localStorage')
forbidText('src/utils/checkoutHandoff.ts', 'sessionStorage')

if (failures.length) {
  console.error('[smoke:checkout-handoff] FAILED')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
console.log('[smoke:checkout-handoff] OK')
