#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const checks = []
const failures = []
function check(name, condition) { checks.push(name); if (!condition) failures.push(name) }
function exists(p) { return fs.existsSync(path.join(root, p)) }
function read(p) { return fs.readFileSync(path.join(root, p), 'utf8') }

const files = [
  'src/components/markdown/HomeSection.vue',
  'src/markdown/directives/homeSectionDirective.ts',
  'src/markdown/mountMarkdownComponents.ts',
  'src/styles/markdown-components.css',
  'src/content/pages/home/index.md',
  'src/content/pages/products/index.md',
  'src/content/pages/works/varuntools-showroom/index.md',
  'src/content/pages/works/varuntools-showroom/images/cover.svg',
]
for (const file of files) check(`${file} exists`, exists(file))

const homeSection = read('src/components/markdown/HomeSection.vue')
const directive = read('src/markdown/directives/homeSectionDirective.ts')
const mount = read('src/markdown/mountMarkdownComponents.ts')
const styles = read('src/styles/markdown-components.css')
const home = read('src/content/pages/home/index.md')
const products = read('src/content/pages/products/index.md')
const workSeed = read('src/content/pages/works/varuntools-showroom/index.md')
const pkg = JSON.parse(read('package.json'))
const checkLaunch = read('scripts/check-launch.mjs')

for (const token of ['emptyMode', 'emptyTitle', 'emptyBody', 'emptyHref', 'emptyLabel']) {
  check(`HomeSection supports ${token}`, homeSection.includes(token))
  check(`directive forwards ${token}`, directive.includes(token) || directive.includes(token.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)))
  check(`mount forwards ${token}`, mount.includes(token) || mount.includes(token.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)))
}

check('HomeSection can hide empty sections', homeSection.includes('shouldRenderSection') && homeSection.includes("props.emptyMode === 'hide'"))
check('HomeSection marks empty state on rendered section', homeSection.includes(':data-empty='))
check('HomeSection renders empty card instead of raw paragraph', homeSection.includes('vt-home-section__empty-card') && !homeSection.includes('<p v-else class="vt-home-section__empty">No entries yet.</p>'))
check('directive validates empty modes', directive.includes('VALID_EMPTY_MODES') && directive.includes("'notice'") && directive.includes("'hide'"))
check('directive emits data-empty-mode', directive.includes('data-empty-mode'))
check('directive emits empty title/body/action attrs', ['data-empty-title', 'data-empty-body', 'data-empty-href', 'data-empty-label'].every((token) => directive.includes(token)))
check('mount reads dataset.emptyMode', mount.includes('el.dataset.emptyMode'))
check('mount reads empty action props', mount.includes('el.dataset.emptyHref') && mount.includes('el.dataset.emptyLabel'))
check('CSS has empty card styles', styles.includes('.vt-home-section__empty-card') && styles.includes('.vt-home-section__empty-link'))
check('CSS keeps empty action touch target', styles.includes('min-height: var(--vt-touch-target, 44px)'))

check('home Featured Products defines empty notice', home.includes('title: Featured Products') && home.includes('emptyTitle: 상품을 준비하고 있습니다') && home.includes('emptyHref: /products'))
check('home Featured Works defines empty notice', home.includes('title: Featured Works') && home.includes('emptyTitle: 대표 작업을 정리하고 있습니다'))
check('home Tools can hide empty section', home.includes('title: Tools') && home.includes('emptyMode: hide'))
check('products index defines product catalog empty notice', products.includes('::product-catalog') && products.includes('title: Product Catalog') && products.includes('emptyTitle: 상품이 없습니다'))
check('core content does not expose default empty copy', !home.includes('No entries yet.') && !products.includes('No entries yet.'))

check('work seed is a work page', workSeed.includes('kind: "work"'))
check('work seed is public active', workSeed.includes('status: "active"') && workSeed.includes('visibility: "public"'))
check('work seed is featured', workSeed.includes('featured: true'))
check('work seed has cover and thumbnail', workSeed.includes('cover: "./images/cover.svg"') && workSeed.includes('thumbnail: "./images/cover.svg"'))
check('work seed is not a product seed', !workSeed.includes('kind: "product"') && !workSeed.includes('product:'))
check('production tree does not contain sample product seed', !exists('src/content/pages/products/sample-product/index.md') && !exists('src/content/pages/products/product-smoke/index.md'))

check('package.json has smoke:seed-content-empty', pkg.scripts?.['smoke:seed-content-empty'] === 'node scripts/smoke-seed-content-empty-section.mjs')
check('check:launch includes smoke:seed-content-empty', checkLaunch.includes('smoke:seed-content-empty'))
check('commit migration doc exists', exists('docs/migration/commit-50-0.md'))
check('bake report exists', exists('BAKE_REPORT_COMMIT_50_0.md'))

if (failures.length) {
  console.error('smoke:seed-content-empty FAILED')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log(`smoke:seed-content-empty OK — ${checks.length} checks`)
