import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const checks = []
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8') }
function exists(file) { return fs.existsSync(path.join(root, file)) }
function check(label, pass) {
  checks.push({ label, pass })
  if (!pass) console.error(`[FAIL] ${label}`)
}

const magnifierVue = 'src/components/markdown/ImageMagnifierBox.vue'
const magnifierTs = 'src/composables/useImageMagnifier.ts'
const docView = 'src/components/markdown/MarkdownDocumentView.vue'
const css = 'src/styles/markdown-lightbox.css'
const qa = 'src/content/pages/lab-markdown-gallery/index.md'

check('ImageMagnifierBox.vue exists', exists(magnifierVue))
check('useImageMagnifier.ts exists', exists(magnifierTs))

const ts = read(magnifierTs)
const vue = read(magnifierVue)
const doc = read(docView)
const styles = read(css)
const qaText = read(qa)

check('STRICT_DOUBLE_CLICK_MS is 100', /STRICT_DOUBLE_CLICK_MS\s*=\s*100/.test(ts))
check('pointermove updates magnifier coordinates', /pointermove/.test(ts) && /getPointerPercent/.test(ts) && /clientX/.test(ts) && /clientY/.test(ts))
check('backgroundPosition uses x and y', /backgroundPosition:\s*`\$\{props\.x\}% \$\{props\.y\}%`/.test(vue))
check('backgroundSize uses zoom', /backgroundSize/.test(vue) && /zoom/.test(vue))
check('does not rely only on native dblclick', !/addEventListener\(['"]dblclick/.test(ts) && !/@dblclick/.test(vue))
check('single click disables magnifier', /disableMagnifier\(image\)/.test(ts) && /setTimeout/.test(ts))
check('strict double click enables magnifier', /isStrictDoubleClick/.test(ts) && /enableMagnifier\(image\)/.test(ts))
check('strict double click stops propagation', /stopPropagation/.test(ts) && /stopImmediatePropagation/.test(ts))
check('mobile CSS disables magnifier', /max-width:\s*720px/.test(styles) && /\.vt-image-magnifier\s*\{\s*display:\s*none/.test(styles))
check('MarkdownDocumentView mounts image magnifier', /mountImageMagnifier/.test(doc) && /cleanupImageMagnifier/.test(doc))
check('Visual QA contains Gallery Magnifier Contract', /Gallery Magnifier Contract/.test(qaText))

const failed = checks.filter((item) => !item.pass)
if (failed.length) {
  console.error(`smoke:image-magnifier failed: ${failed.length} checks failed`)
  process.exit(1)
}
console.log(`smoke:image-magnifier OK — ${checks.length} checks`)
