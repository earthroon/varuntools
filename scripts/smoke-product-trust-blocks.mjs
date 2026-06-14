#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import process from 'node:process'

const issues = []

function read(file) {
  if (!existsSync(file)) {
    issues.push(`missing file: ${file}`)
    return ''
  }
  return readFileSync(file, 'utf8')
}

function mustInclude(file, needle, label = needle) {
  const text = read(file)
  if (!text.includes(needle)) issues.push(`${file} missing ${label}`)
}

const requiredFiles = [
  'src/utils/storePolicies.ts',
  'src/utils/productTrust.ts',
  'src/components/markdown/ProductTrustBlocks.vue',
  'src/markdown/directives/productTrustDirective.ts',
  'scripts/smoke-store-policy-pages.mjs',
  'scripts/smoke-product-trust-blocks.mjs',
]

for (const file of requiredFiles) read(file)

mustInclude('src/utils/storePolicies.ts', 'STORE_POLICY_LINKS')
mustInclude('src/utils/storePolicies.ts', "'digital-download'")
mustInclude('src/utils/productTrust.ts', 'resolveProductTrustBlocks')
mustInclude('src/utils/productTrust.ts', "type === 'physical'")
mustInclude('src/utils/productTrust.ts', "type === 'digital'")
mustInclude('src/utils/productTrust.ts', "missingDownload ? 'warning'")
mustInclude('src/utils/productTrust.ts', 'dedupeStable')

mustInclude('src/components/markdown/ProductTrustBlocks.vue', 'resolveProductTrustBlocks')
mustInclude('src/components/markdown/ProductTrustBlocks.vue', 'vt-product-trust')
mustInclude('src/components/markdown/ProductTrustBlocks.vue', '상품 정보가 없습니다')

mustInclude('src/markdown/directives/productTrustDirective.ts', '<product-trust></product-trust>')
mustInclude('src/markdown/directiveTypes.ts', "| 'product-trust'")
mustInclude('src/markdown/directiveTypes.ts', "'product-trust'")
mustInclude('src/markdown/directives/index.ts', 'renderProductTrustDirective')
mustInclude('src/markdown/directives/index.ts', "case 'product-trust'")
mustInclude('src/markdown/mountMarkdownComponents.ts', 'ProductTrustBlocks')
mustInclude('src/markdown/mountMarkdownComponents.ts', "querySelectorAll('product-trust')")
mustInclude('src/markdown/mountMarkdownComponents.ts', 'product: frontmatter?.product || null')

mustInclude('src/content/templates/product.md', '::product-cta')
mustInclude('src/content/templates/product.md', '::product-trust')
mustInclude('src/content/templates/product.csv', 'product-trust')
mustInclude('scripts/lib/csv-markdown.mjs', 'function renderProductTrust')
mustInclude('scripts/lib/csv-markdown.mjs', "case 'product-trust'")

mustInclude('scripts/validate-content.mjs', 'product-detail-missing-trust')
mustInclude('scripts/validate-content.mjs', 'product-trust-without-product')
mustInclude('src/styles/markdown-components.css', '.vt-product-trust')
mustInclude('package.json', 'smoke:store-policies')
mustInclude('package.json', 'smoke:product-trust')
mustInclude('scripts/check-launch.mjs', 'smoke:store-policies')
mustInclude('scripts/check-launch.mjs', 'smoke:product-trust')

const trustSource = read('src/utils/productTrust.ts')
const order = ['store', 'shipping', 'digital-download', 'refund', 'privacy']
for (const key of order) {
  if (!trustSource.includes(key)) issues.push(`productTrust missing ${key}`)
}

if (issues.length) {
  console.error('[VARUNTOOLS][smoke:product-trust] FAILED')
  for (const issue of issues) console.error(`- ${issue}`)
  process.exit(1)
}

console.log('[VARUNTOOLS][smoke:product-trust] OK')
console.log('Product trust block contract, directive, template, and launch wiring are present.')
