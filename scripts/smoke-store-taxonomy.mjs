#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
const root = process.cwd(); const failures = []; const checks = []
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8') }
function exists(file) { return fs.existsSync(path.join(root, file)) }
function check(name, condition) { checks.push(name); if (!condition) failures.push(name) }
for (const file of ['src/config/storeTaxonomy.ts','src/utils/storeTaxonomy.ts','src/utils/productCatalog.ts','src/components/markdown/ProductCatalog.vue','src/markdown/directives/productCatalogDirective.ts','scripts/generate-search-index.mjs','scripts/validate-content.mjs','src/content/pages/products/dummy-catalog/page.csv','src/content/pages/products/dummy-catalog/index.md','public/search-index.json','docs/authoring/store-taxonomy.md','docs/migration/commit-63.md']) check(`${file} exists`, exists(file))
const config = read('src/config/storeTaxonomy.ts'); for (const token of ['productTypes','productCategories','productSubcategories','productCollections','varun-tools','templates','workflow']) check(`storeTaxonomy config contains ${token}`, config.includes(token))
const util = read('src/utils/storeTaxonomy.ts'); for (const token of ['normalizeTaxonomyValue','isKnownProductType','resolveProductCategoryLabel','getProductCategoryOptions','sortByTaxonomyOrder']) check(`storeTaxonomy util contains ${token}`, util.includes(token))
const catalogUtil = read('src/utils/productCatalog.ts'); for (const token of ['category?: string','collection?: string','getAvailableProductCategories','getAvailableProductCollections','filter.category','entry.category']) check(`productCatalog util contains ${token}`, catalogUtil.includes(token))
const catalog = read('src/components/markdown/ProductCatalog.vue'); for (const token of ['categoryFilter','collectionFilter','showCategoryFilter','showCollectionFilter','resolveProductCategoryLabel','전체 카테고리','전체 컬렉션']) check(`ProductCatalog contains ${token}`, catalog.includes(token))
const directive = read('src/markdown/directives/productCatalogDirective.ts'); for (const token of ['defaultCategory','defaultCollection','showCategoryFilter','showCollectionFilter','data-default-category','data-default-collection']) check(`productCatalogDirective supports ${token}`, directive.includes(token))
const mount = read('src/markdown/mountMarkdownComponents.ts'); for (const token of ['showCategoryFilter','showCollectionFilter','defaultCategory','defaultCollection']) check(`mountMarkdownComponents passes ${token}`, mount.includes(token))
const dummyCsv = read('src/content/pages/products/dummy-catalog/page.csv'); const dummyMd = read('src/content/pages/products/dummy-catalog/index.md')
for (const token of ['type=digital','category=templates','subcategory=workflow','collection=varun-tools','series=store-starter']) check(`dummy page.csv contains ${token}`, dummyCsv.includes(token))
for (const token of ['type: digital','category: templates','subcategory: workflow','collection: varun-tools','series: store-starter']) check(`dummy index.md contains ${token}`, dummyMd.includes(token))
const generateSearch = read('scripts/generate-search-index.mjs'); for (const token of ['category: product.category','subcategory: product.subcategory','collection: product.collection']) check(`generate-search-index contains ${token}`, generateSearch.includes(token))
const validate = read('scripts/validate-content.mjs'); for (const token of ['VALID_PRODUCT_CATEGORIES','VALID_PRODUCT_COLLECTIONS','product.category','unknown-product-taxonomy','product-status-published-forbidden']) check(`validate-content contains ${token}`, validate.includes(token))
let index = null; try { index = JSON.parse(read('public/search-index.json')) } catch {}
const dummy = index?.entries?.find((entry) => entry.slug === 'products/dummy-catalog')
check('search index includes dummy category', dummy?.product?.category === 'templates'); check('search index includes dummy subcategory', dummy?.product?.subcategory === 'workflow'); check('search index includes dummy collection', dummy?.product?.collection === 'varun-tools')
const pkg = JSON.parse(read('package.json')); check('package has smoke:store-taxonomy', pkg.scripts?.['smoke:store-taxonomy'] === 'node scripts/smoke-store-taxonomy.mjs'); check('check-launch includes smoke:store-taxonomy', read('scripts/check-launch.mjs').includes('smoke:store-taxonomy'))
if (failures.length) { console.error('smoke:store-taxonomy FAILED'); failures.forEach((failure) => console.error(`- ${failure}`)); process.exit(1) }
console.log(`smoke:store-taxonomy OK — ${checks.length} checks`)
