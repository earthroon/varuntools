import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const exists = (file) => fs.existsSync(path.join(root, file))

let failed = false

function pass(name, ok) {
  if (!ok) {
    console.error(name)
    failed = true
  }
}

const useCollection = read('src/composables/usePublicContentCollection.ts')
const adjacentUtil = read('src/utils/getAdjacentPublicContentEntries.ts')
const documentView = read('src/components/markdown/MarkdownDocumentView.vue')
const workPager = read('src/components/works/WorkPager.vue')
const pkg = JSON.parse(read('package.json'))

pass('forbidden src/data/works.ts exists', !exists('src/data/works.ts'))

pass('usePublicContentCollection exports getPublicContentEntries', useCollection.includes('export function getPublicContentEntries'))
pass('usePublicContentCollection allEntries uses collection SSOT helper', useCollection.includes('const allEntries = computed(() => getPublicContentEntries(pages, options))'))
pass('getPublicContentEntries uses pageToEntry', useCollection.includes('.map(pageToEntry)'))
pass('getPublicContentEntries filters public visibility', useCollection.includes("entry.visibility === 'public'"))
pass('getPublicContentEntries filters status', useCollection.includes("entry.status !== 'draft'") && useCollection.includes("entry.status !== 'archived'") && useCollection.includes("entry.status !== 'trashed'"))

pass('adjacent util exports getAdjacentPublicContentEntries', adjacentUtil.includes('export function getAdjacentPublicContentEntries'))
pass('adjacent util normalizes current route', adjacentUtil.includes('normalizePublicContentAdjacentKey'))
pass('adjacent util matches slug', adjacentUtil.includes('entry.slug'))
pass('adjacent util matches href', adjacentUtil.includes('entry.href'))
pass('adjacent util matches contentDir', adjacentUtil.includes('entry.contentDir'))

pass('MarkdownDocumentView imports WorkPager', documentView.includes("import WorkPager from '@/components/works/WorkPager.vue'"))
pass('MarkdownDocumentView imports getPublicContentEntries', documentView.includes("getPublicContentEntries"))
pass('MarkdownDocumentView imports getAdjacentPublicContentEntries', documentView.includes("getAdjacentPublicContentEntries"))
pass('MarkdownDocumentView computes publicContentAdjacent', documentView.includes('const publicContentAdjacent = computed'))
pass('MarkdownDocumentView uses works tab scope index', documentView.includes("getPublicContentEntries(pagesRef.value, { scope: 'index' })"))
pass('MarkdownDocumentView has fallback guard', documentView.includes('shouldShowPublicContentAdjacentPager'))
pass('MarkdownDocumentView avoids duplicate pageRegistry pager', documentView.includes('workDetailContext.value?.previous') && documentView.includes('workDetailContext.value?.next'))
pass('MarkdownDocumentView has R3 footer marker', documentView.includes('data-vt-ui23r3-public-content-adjacent-footer="1"'))
pass('MarkdownDocumentView has R3 pager marker', documentView.includes('data-vt-ui23r3-public-content-adjacent-pager="1"'))

pass('WorkPager uses minimal WorkPagerEntry', workPager.includes('export type WorkPagerEntry'))
pass('WorkPager no longer imports WorkCardEntry directly', !workPager.includes("import type { WorkCardEntry } from '@/markdown/pageRegistry'"))
pass('WorkPager preserves R1 visible nav marker', workPager.includes('data-vt-ui23r1-visible-adjacent-nav="1"'))
pass('WorkPager preserves previous link marker', workPager.includes('data-vt-ui23r1-adjacent-link="previous"'))
pass('WorkPager preserves next link marker', workPager.includes('data-vt-ui23r1-adjacent-link="next"'))

pass('package has VT-UI-23R3 smoke script', pkg.scripts?.['smoke:vt-ui-23r3-public-content-adjacent-detail-pager'] === 'node scripts/smoke-vt-ui-23r3-public-content-adjacent-detail-pager.mjs')

if (failed) {
  console.error('FAIL_VT_UI_23R3_PUBLIC_CONTENT_ADJACENT_DETAIL_PAGER')
  process.exit(1)
}

console.log('PASS_VT_UI_23R3_PUBLIC_CONTENT_ADJACENT_DETAIL_PAGER')
console.log('PASS_VT_UI_23R3_WORKS_TAB_COLLECTION_SSOT')
console.log('PASS_VT_UI_23R3_CURRENT_ROUTE_ENTRY_MATCH')
console.log('PASS_VT_UI_23R3_NO_PAGEREGISTRY_WORK_CONTEXT_DETOUR')
