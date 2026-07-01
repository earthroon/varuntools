import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const missing = []

function read(rel) {
  const file = path.join(root, rel)
  if (!fs.existsSync(file)) {
    missing.push(rel + ' missing')
    return ''
  }
  return fs.readFileSync(file, 'utf8')
}

function requireToken(label, text, token) {
  if (!text.includes(token)) missing.push(label + ' missing token: ' + token)
}

function forbidToken(label, text, token) {
  if (text.includes(token)) missing.push(label + ' forbidden token: ' + token)
}

const adjacent = read('src/utils/getAdjacentWorks.ts')
const registry = read('src/markdown/pageRegistry.ts')
const pager = read('src/components/works/WorkPager.vue')
const pkg = read('package.json')

if (fs.existsSync(path.join(root, 'src/data/works.ts'))) {
  missing.push('src/data/works.ts must not be created')
}

requireToken('getAdjacentWorks.ts', adjacent, 'export function getAdjacentWorks')
requireToken('getAdjacentWorks.ts', adjacent, 'currentSlug: string')
requireToken('getAdjacentWorks.ts', adjacent, 'a.order - b.order')
requireToken('getAdjacentWorks.ts', adjacent, 'previous: null')
requireToken('getAdjacentWorks.ts', adjacent, 'next: null')
requireToken('getAdjacentWorks.ts', adjacent, 'currentIndex < 0')

requireToken('pageRegistry.ts', registry, "import { getAdjacentWorks } from '@/utils/getAdjacentWorks'")
requireToken('pageRegistry.ts', registry, 'return getAdjacentWorks(entries, current.slug)')
forbidToken('pageRegistry.ts adjacent', registry, "const sorted = sortWorkEntries(entries, 'featured')")

requireToken('WorkPager.vue', pager, 'previous?: WorkCardEntry | null')
requireToken('WorkPager.vue', pager, 'next?: WorkCardEntry | null')
requireToken('WorkPager.vue', pager, '<RouterLink')
requireToken('WorkPager.vue', pager, ':to="previousTo"')
requireToken('WorkPager.vue', pager, ':to="nextTo"')
requireToken('WorkPager.vue', pager, '.vt-work-pager')
requireToken('WorkPager.vue', pager, 'grid-template-columns: repeat(2, minmax(0, 1fr));')
requireToken('WorkPager.vue', pager, '@media (max-width: 720px)')

requireToken('package.json', pkg, 'smoke:vt-ui-23-work-adjacent-navigation')

if (missing.length > 0) {
  console.error('FAIL_VT_UI_23_WORK_ADJACENT_NAVIGATION_CONTEXT')
  for (const item of missing) console.error('- ' + item)
  process.exit(1)
}

console.log('PASS_VT_UI_23_WORK_ADJACENT_NAVIGATION_CONTEXT')
console.log('PASS_VT_UI_23_PAGE_REGISTRY_WORK_META_PROJECTION')
console.log('PASS_VT_UI_23_ORDER_BASED_PREVIOUS_NEXT')
console.log('PASS_VT_UI_23_NO_DUPLICATE_WORKS_DATA_SSOT')
