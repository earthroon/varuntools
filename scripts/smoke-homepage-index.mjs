#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const checks = []
const failures = []
function check(name, condition) { checks.push(name); if (!condition) failures.push(name) }
function exists(p) { return fs.existsSync(path.join(root, p)) }
function read(p) { return fs.readFileSync(path.join(root, p), 'utf8') }

for (const file of [
  'src/content/pages/home/index.md',
  'src/components/markdown/HomeSection.vue',
  'src/components/markdown/ProductCard.vue',
  'src/markdown/directives/homeSectionDirective.ts',
  'src/utils/formatProduct.ts',
]) check(`${file} exists`, exists(file))

const directiveTypes = read('src/markdown/directiveTypes.ts')
const directiveIndex = read('src/markdown/directives/index.ts')
const mount = read('src/markdown/mountMarkdownComponents.ts')
const home = read('src/content/pages/home/index.md')
const products = read('src/content/pages/products/index.md')
const homeSection = read('src/components/markdown/HomeSection.vue')
const productCard = read('src/components/markdown/ProductCard.vue')
const styles = read('src/styles/markdown-components.css')
const pkg = JSON.parse(read('package.json'))
const checkLaunch = read('scripts/check-launch.mjs')

check('directive type includes home-section', directiveTypes.includes("'home-section'"))
check('directive renderer includes home-section', directiveIndex.includes('renderHomeSectionDirective'))
check('mountMarkdownComponents mounts home-section', mount.includes("root.querySelectorAll('home-section')") && mount.includes('HomeSection'))
check('home page contains Featured Products', home.includes('Featured Products'))
check('home page contains Featured Works', home.includes('Featured Works'))
check('home page contains Tools', home.includes('source: tools'))
check('home page contains Lab', home.includes('source: lab'))
check('products index uses product-catalog', products.includes('::product-catalog') && products.includes('Product Catalog'))
check('HomeSection filters featured', homeSection.includes('props.featured') && homeSection.includes('frontmatter.featured'))
check('HomeSection filters source/category', homeSection.includes('categoryOf') && homeSection.includes('category !== source'))
check('HomeSection sorts by order', homeSection.includes('a.order - b.order'))
check('HomeSection excludes draft/hidden', homeSection.includes('isHidden') && homeSection.includes("product?.status === 'hidden'"))
check('HomeSection supports showUnavailable', homeSection.includes('showUnavailable') && homeSection.includes('isUnavailableProduct'))
check('ProductCard supports product.status', productCard.includes('status') && productCard.includes('formatProductStatus'))
check('ProductCard supports price display', productCard.includes('formatProductPrice') && productCard.includes('priceLabel'))
check('ProductCard supports checkoutUrl/externalStoreUrl', productCard.includes('checkoutUrl') && productCard.includes('externalStoreUrl'))
check('formatProduct supports KRW', read('src/utils/formatProduct.ts').includes('₩'))
check('CSS has home section styles', styles.includes('.vt-home-section') && styles.includes('.vt-home-section__grid'))
check('CSS has product card styles', styles.includes('.vt-product-card') && styles.includes('.vt-product-card__price'))
check('Visual QA contains Homepage Index Contract', read('src/content/pages/lab-markdown-gallery/index.md').includes('Homepage Index Contract'))
check('package.json has smoke:homepage-index', pkg.scripts?.['smoke:homepage-index'] === 'node scripts/smoke-homepage-index.mjs')
check('check:launch includes smoke:homepage-index', checkLaunch.includes('smoke:homepage-index'))

if (failures.length) {
  console.error('smoke:homepage-index FAILED')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log(`smoke:homepage-index OK — ${checks.length} checks`)
