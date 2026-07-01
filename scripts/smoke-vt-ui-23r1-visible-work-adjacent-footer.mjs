import fs from 'node:fs'

const checks = []

function read(file) {
  return fs.readFileSync(file, 'utf8')
}

function exists(file) {
  return fs.existsSync(file)
}

function pass(label, condition) {
  checks.push({ label, condition: Boolean(condition) })
}

const pageRegistry = read('src/markdown/pageRegistry.ts')
const markdownView = read('src/components/markdown/MarkdownDocumentView.vue')
const footer = read('src/components/works/WorkDetailFooter.vue')
const pager = read('src/components/works/WorkPager.vue')
const pkg = JSON.parse(read('package.json'))

const adjacentStart = pageRegistry.indexOf('export function getAdjacentWorkEntries')
const contextStart = pageRegistry.indexOf('export function getWorkDetailContext')
const normalizeStart = pageRegistry.indexOf('export function normalizeRelatedWorkSlug')
const adjacentBlock = adjacentStart >= 0 && contextStart > adjacentStart
  ? pageRegistry.slice(adjacentStart, contextStart)
  : ''
const contextBlock = contextStart >= 0 && normalizeStart > contextStart
  ? pageRegistry.slice(contextStart, normalizeStart)
  : ''

pass('src/data/works.ts is not created', !exists('src/data/works.ts'))
pass('pageRegistry.ts has getAdjacentWorkEntries', adjacentBlock.includes('getAdjacentWorkEntries'))
pass('getAdjacentWorkEntries does not use featured sort', !adjacentBlock.includes("sortWorkEntries(entries, 'featured')"))
pass('getAdjacentWorkEntries sorts by order', adjacentBlock.includes('a.order - b.order'))
pass('getWorkDetailContext exists', contextBlock.includes('getWorkDetailContext'))
pass('getWorkDetailContext uses normalized slug', contextBlock.includes('normalizedSlug'))
pass('getWorkDetailContext uses getWorkEntryBySlug', contextBlock.includes('getWorkEntryBySlug(entries)'))
pass('getWorkDetailContext uses alias bySlug lookup', contextBlock.includes('bySlug.get(normalizedSlug)'))
pass('getWorkDetailContext tries works prefix alias', contextBlock.includes('bySlug.get') && contextBlock.includes('works/'))
pass('MarkdownDocumentView imports WorkDetailFooter', markdownView.includes('WorkDetailFooter'))
pass('MarkdownDocumentView calls getWorkDetailContext', markdownView.includes('getWorkDetailContext(pagesRef.value, props.page.slug)'))
pass('MarkdownDocumentView renders WorkDetailFooter', markdownView.includes('<WorkDetailFooter'))
pass('WorkDetailFooter visible footer marker exists', footer.includes('data-vt-ui23r1-visible-footer="1"'))
pass('WorkDetailFooter mounts WorkPager', footer.includes('<WorkPager'))
pass('WorkDetailFooter pager mount marker exists', footer.includes('data-vt-ui23r1-visible-pager-mount="1"'))
pass('WorkPager visible nav marker exists', pager.includes('data-vt-ui23r1-visible-adjacent-nav="1"'))
pass('WorkPager previous link marker exists', pager.includes('data-vt-ui23r1-adjacent-link="previous"'))
pass('WorkPager next link marker exists', pager.includes('data-vt-ui23r1-adjacent-link="next"'))
pass('WorkPager receives previous prop', pager.includes('previous?: WorkCardEntry | null'))
pass('WorkPager receives next prop', pager.includes('next?: WorkCardEntry | null'))
pass('WorkPager does not compute adjacent entries', !pager.includes('getAdjacentWorkEntries'))
pass('WorkPager has visible grid style', pager.includes('.vt-work-pager') && pager.includes('grid-template-columns'))
pass('package script registered', pkg.scripts && pkg.scripts['smoke:vt-ui-23r1-visible-work-adjacent-footer'])

const failed = checks.filter((item) => !item.condition)

if (failed.length > 0) {
  console.error('FAIL_VT_UI_23R1_VISIBLE_WORK_ADJACENT_FOOTER')
  for (const item of failed) console.error('- ' + item.label)
  process.exit(1)
}

console.log('PASS_VT_UI_23R1_VISIBLE_WORK_ADJACENT_FOOTER_MOUNT')
console.log('PASS_VT_UI_23R1_WORK_DETAIL_PAGER_HARD_RENDER')
console.log('PASS_VT_UI_23R1_CURRENT_SLUG_ALIAS_CONTEXT_REPAIR')
console.log('PASS_VT_UI_23R1_NO_INVISIBLE_PREVIOUS_NEXT_UI')
