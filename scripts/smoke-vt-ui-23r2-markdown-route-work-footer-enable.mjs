import fs from 'node:fs'

function read(file) {
  return fs.readFileSync(file, 'utf8')
}

const checks = []
function pass(label, condition) {
  if (!condition) checks.push(label)
}

const loaderFile = 'src/markdown/lazyMarkdownPageLoader.ts'
const pageFile = 'src/pages/MarkdownPage.vue'
const footerFile = 'src/components/works/WorkDetailFooter.vue'
const pagerFile = 'src/components/works/WorkPager.vue'
const registryFile = 'src/markdown/pageRegistry.ts'
const packageFile = 'package.json'

const loader = read(loaderFile)
const page = read(pageFile)
const footer = read(footerFile)
const pager = read(pagerFile)
const registry = read(registryFile)
const pkg = JSON.parse(read(packageFile))

pass('lazy loader exports readCachedMarkdownPages', loader.includes('export function readCachedMarkdownPages'))
pass('lazy loader exports loadAllMarkdownPages', loader.includes('export async function loadAllMarkdownPages'))
pass('lazy loader uses markdownRouteIndexEntries as page source', loader.includes('markdownRouteIndexEntries.map'))
pass('lazy loader dedupes loaded pages', loader.includes('uniqueLoadedMarkdownPages'))

pass('MarkdownPage imports loadAllMarkdownPages', page.includes('loadAllMarkdownPages'))
pass('MarkdownPage imports readCachedMarkdownPages', page.includes('readCachedMarkdownPages'))
pass('MarkdownPage owns pages shallowRef', page.includes('const pages = shallowRef<LoadedMarkdownPage[]>'))
pass('MarkdownPage starts all page load in route watcher', page.includes('const allPagesPromise = loadAllMarkdownPages()'))
pass('MarkdownPage assigns loaded pages prop source', page.includes('pages.value = loadedPages'))
pass('MarkdownPage passes pages to MarkdownDocumentView', page.includes(':pages="pages"'))
pass('MarkdownPage does not pass empty pages array', !page.includes(':pages="[]"'))
pass('MarkdownPage does not force footer off', !page.includes(':show-related-footer="false"'))
pass('MarkdownPage explicitly opens footer gate', page.includes(':show-related-footer="true"'))

pass('pageRegistry has alias lookup for context', registry.includes('getWorkEntryBySlug(entries)'))
pass('pageRegistry getWorkDetailContext uses normalized slug', registry.includes('const normalizedSlug = normalizeRelatedWorkSlug(slug)'))
pass('pageRegistry adjacent uses order sort', registry.includes('a.order - b.order'))
pass('pageRegistry adjacent no longer uses featured sort', !registry.includes("const sorted = sortWorkEntries(entries, 'featured')"))

pass('WorkDetailFooter visible footer marker exists', footer.includes('data-vt-ui23r1-visible-footer="1"'))
pass('WorkDetailFooter pager mount marker exists', footer.includes('data-vt-ui23r1-visible-pager-mount="1"'))
pass('WorkPager visible nav marker exists', pager.includes('data-vt-ui23r1-visible-adjacent-nav="1"'))
pass('WorkPager previous link marker exists', pager.includes('data-vt-ui23r1-adjacent-link="previous"'))
pass('WorkPager next link marker exists', pager.includes('data-vt-ui23r1-adjacent-link="next"'))

pass('src/data/works.ts does not exist', !fs.existsSync('src/data/works.ts'))
pass('package has VT-UI-23R2 smoke command', pkg.scripts && pkg.scripts['smoke:vt-ui-23r2-markdown-route-work-footer-enable'])

if (checks.length > 0) {
  console.error('FAIL_VT_UI_23R2_MARKDOWN_ROUTE_WORK_FOOTER_ENABLE')
  for (const check of checks) console.error('- ' + check)
  process.exit(1)
}

console.log('PASS_VT_UI_23R2_MARKDOWN_ROUTE_WORK_FOOTER_ENABLE')
console.log('PASS_VT_UI_23R2_LAZY_PAGE_REGISTRY_PAGES_PROP')
console.log('PASS_VT_UI_23R2_RELATED_FOOTER_MOUNT_GATE_REOPEN')
console.log('PASS_VT_UI_23R2_NO_DEAD_WORKPAGER_WIRING')
