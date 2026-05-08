#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const checks = []
const failures = []
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8') }
function exists(file) { return fs.existsSync(path.join(root, file)) }
function check(name, condition) { checks.push(name); if (!condition) failures.push(name) }

for (const file of [
  'src/components/markdown/ProductCatalog.vue',
  'src/utils/productCatalog.ts',
  'src/markdown/directives/productCatalogDirective.ts',
  'src/content/pages/products/index.md',
]) check(`${file} exists`, exists(file))

const component = read('src/components/markdown/ProductCatalog.vue')
for (const token of ['ProductCard', 'query', 'statusFilter', 'typeFilter', 'categoryFilter', 'collectionFilter', 'tagFilter', 'sortMode', 'aria-live', '필터 초기화']) {
  check(`ProductCatalog contains ${token}`, component.includes(token))
}

const util = read('src/utils/productCatalog.ts')
for (const token of ['getProductCatalogEntries', 'filterProductCatalogEntries', 'sortProductCatalogEntries', 'getAvailableProductCategories', 'getAvailableProductCollections', "productStatus === 'draft'", "productStatus === 'hidden'", "frontmatter.status === 'archived'"]) {
  check(`productCatalog util contains ${token}`, util.includes(token))
}

const directiveTypes = read('src/markdown/directiveTypes.ts')
check('directiveTypes registers product-catalog', directiveTypes.includes("'product-catalog'"))
check('directive index renders product-catalog', read('src/markdown/directives/index.ts').includes('renderProductCatalogDirective'))
check('mountMarkdownComponents mounts product-catalog', read('src/markdown/mountMarkdownComponents.ts').includes("querySelectorAll('product-catalog')") && read('src/markdown/mountMarkdownComponents.ts').includes('ProductCatalog'))
check('products page uses ::product-catalog', read('src/content/pages/products/index.md').includes('::product-catalog'))
check('products page no longer uses home-section product catalog', !read('src/content/pages/products/index.md').includes('::home-section'))
check('dummy catalog is coming-soon', read('src/content/pages/products/dummy-catalog/index.md').includes('status: coming-soon'))
check('dummy catalog has taxonomy sample', read('src/content/pages/products/dummy-catalog/index.md').includes('category: templates') && read('src/content/pages/products/dummy-catalog/index.md').includes('collection: varun-tools'))
check('products page enables category filter', read('src/content/pages/products/index.md').includes('showCategoryFilter: true') && read('src/content/pages/products/index.md').includes('defaultCategory: all'))
check('package has smoke:product-filter', JSON.parse(read('package.json')).scripts?.['smoke:product-filter'] === 'node scripts/smoke-product-filter.mjs')
check('check:launch includes smoke:product-filter', read('scripts/check-launch.mjs').includes('smoke:product-filter'))

if (failures.length) {
  console.error('smoke:product-filter FAILED')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log(`smoke:product-filter OK — ${checks.length} checks`)
