#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const issues = []

function file(rel) {
  return path.join(root, rel)
}

function read(rel) {
  return readFileSync(file(rel), 'utf8')
}

function mustExist(rel) {
  if (!existsSync(file(rel))) issues.push(`missing file: ${rel}`)
}

function mustInclude(rel, needle, label = needle) {
  const text = read(rel)
  if (!text.includes(needle)) issues.push(`${rel} missing ${label}`)
}

function mustMatch(rel, re, label = String(re)) {
  const text = read(rel)
  if (!re.test(text)) issues.push(`${rel} missing ${label}`)
}

const requiredFiles = [
  'src/utils/productAction.ts',
  'src/components/markdown/ProductDetailCta.vue',
  'src/markdown/directives/productCtaDirective.ts',
  'scripts/smoke-product-cta.mjs',
]

for (const rel of requiredFiles) mustExist(rel)

mustInclude('src/utils/productAction.ts', 'export function resolveProductAction')
mustInclude('src/utils/productAction.ts', 'normalizeCheckoutHandoff')
mustInclude('src/utils/productAction.ts', "'buy'")
mustInclude('src/utils/productAction.ts', "'external-store'")
mustInclude('src/utils/productAction.ts', "'link-missing'")
mustInclude('src/utils/productAction.ts', 'isExternalProductActionHref')

mustInclude('src/components/markdown/ProductDetailCta.vue', 'resolveProductAction')
mustInclude('src/components/markdown/ProductDetailCta.vue', 'formatProductPrice')
mustInclude('src/components/markdown/ProductDetailCta.vue', "'_blank'")
mustInclude('src/components/markdown/ProductDetailCta.vue', 'noopener noreferrer')
mustInclude('src/components/markdown/ProductDetailCta.vue', 'vt-product-detail-cta')

mustInclude('src/components/markdown/ProductCard.vue', 'resolveProductAction')
mustInclude('src/components/markdown/ProductCard.vue', 'primaryAction.external')

mustInclude('src/markdown/directives/productCtaDirective.ts', '<product-cta></product-cta>')
mustInclude('src/markdown/directives/index.ts', 'renderProductCtaDirective')
mustInclude('src/markdown/directives/index.ts', "case 'product-cta'")
mustInclude('src/markdown/directiveTypes.ts', "| 'product-cta'")
mustInclude('src/markdown/directiveTypes.ts', "'product-cta'")

mustInclude('src/markdown/mountMarkdownComponents.ts', 'ProductDetailCta')
mustInclude('src/markdown/mountMarkdownComponents.ts', "querySelectorAll('product-cta')")
mustInclude('src/markdown/mountMarkdownComponents.ts', 'product: frontmatter?.product || null')
mustInclude('src/markdown/useMarkdownComponentMount.ts', 'page: options.page.value')

mustInclude('src/content/templates/product.md', '::product-cta')
mustMatch('src/content/templates/product.csv', /^product-cta,/m, 'product-cta CSV block')
mustInclude('scripts/lib/csv-markdown.mjs', 'function renderProductCta')
mustInclude('scripts/lib/csv-markdown.mjs', "case 'product-cta'")

mustInclude('scripts/validate-content.mjs', 'product-detail-missing-cta')
mustInclude('src/styles/markdown-components.css', '.vt-product-detail-cta')
mustInclude('package.json', 'smoke:product-cta')
mustInclude('scripts/check-launch.mjs', 'smoke:product-cta')

if (issues.length) {
  console.error('[VARUNTOOLS][smoke:product-cta] FAILED')
  for (const issue of issues) console.error(`- ${issue}`)
  process.exit(1)
}

console.log('[VARUNTOOLS][smoke:product-cta] OK')
console.log('Product detail CTA contract is wired.')
