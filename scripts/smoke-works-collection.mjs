#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const checks = []
const failures = []
function check(name, condition) { checks.push(name); if (!condition) failures.push(name) }
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8') }

const pageRegistry = read('src/markdown/pageRegistry.ts')
const composable = read('src/composables/useWorksCollection.ts')
const filters = read('src/components/works/WorkCollectionFilters.vue')
const searchPanel = read('src/components/works/WorksSearchPanel.vue')
const grid = read('src/components/works/WorksCollectionGrid.vue')
const card = read('src/components/markdown/WorkCard.vue')
const worksPage = read('src/pages/WorksPage.vue')
const contentTypes = read('src/types/content.ts')

for (const token of [
  'type WorkCardEntry',
  'type: WorkType',
  'workStatus: WorkStatus',
  'role: string[]',
  'stack: string[]',
  'weight: number',
  'hasWorkMetadata: boolean',
  'getWorkObject(frontmatter)',
  '(frontmatter as any).work',
]) {
  check(`pageRegistry contains ${token}`, pageRegistry.includes(token))
}

for (const token of [
  'filter.role',
  'filter.stack',
  'filter.year',
  'filter.featuredOnly',
  'entry.role.includes',
  'entry.stack.includes',
  'Number(b.featured) - Number(a.featured)',
  'b.weight - a.weight',
  'Number(b.year ?? 0)',
  'buildWorkFilterOptions',
  'getAvailableRoles',
  'getAvailableStacks',
  'getAvailableYears',
]) {
  check(`pageRegistry supports ${token}`, pageRegistry.includes(token))
}

check('private work status is hidden', pageRegistry.includes("entry.workStatus === 'private'") || pageRegistry.includes("HIDDEN_WORK_STATUSES.has(entry.workStatus)"))
check('draft work status is hidden by default', pageRegistry.includes("entry.workStatus === 'draft'") || pageRegistry.includes("HIDDEN_WORK_STATUSES.has(entry.workStatus)"))
check('work metadata makes collection eligible', pageRegistry.includes('entry.hasWorkMetadata'))
check('query haystack includes role/stack/tools/tags', pageRegistry.includes('...entry.role') && pageRegistry.includes('...entry.stack') && pageRegistry.includes('...entry.tools') && pageRegistry.includes('...entry.tags'))
check('related scoring includes stack overlap', pageRegistry.includes('sharedStack'))

for (const token of ['role = ref', 'stack = ref', 'year = ref', 'featuredOnly = ref', 'buildFacetIndex', 'filterPortfolioEntries', 'route.query.type', 'featured: \'1\'']) {
  check(`useWorksCollection contains ${token}`, composable.includes(token))
}

for (const token of ["defineModel<string>(\'role\'", "defineModel<string>(\'stack\'", "defineModel<string>(\'year\'", "defineModel<boolean>(\'featuredOnly\'", 'Featured only', 'value="featured"', 'value="year"']) {
  check(`legacy filters expose ${token}`, filters.includes(token))
}

for (const token of ["defineModel<string>(\'selectedRole\'", "defineModel<string>(\'selectedStack\'", "defineModel<string>(\'selectedYear\'", "defineModel<boolean>(\'featuredOnly\'", 'PortfolioFacetItem', '{{ item.count }}', 'aria-live="polite"']) {
  check(`search panel exposes ${token}`, searchPanel.includes(token))
}

for (const token of [':role="entry.role"', ':stack="entry.stack"', ':tags="entry.tags"', ':year="entry.year"', ':featured="entry.featured"', ':status="entry.workStatus"']) {
  check(`grid passes ${token}`, grid.includes(token))
}

for (const token of ['role?: string[]', 'stack?: string[]', 'tags?: string[]', 'roleChips', 'stackChips', 'tagChips', 'vt-work-card__featured', 'vt-work-card__chip', 'card.status === \'archived\'']) {
  check(`WorkCard renders ${token}`, card.includes(token))
}

for (const token of ['v-model:selected-role="role"', 'v-model:selected-stack="stack"', 'v-model:selected-year="year"', 'v-model:featured-only="featuredOnly"', ':role-options="roleOptions"', ':stack-options="stackOptions"', ':year-options="yearOptions"']) {
  check(`WorksPage wires ${token}`, worksPage.includes(token))
}

check('MarkdownFrontmatter has PortfolioWorkFrontmatter', contentTypes.includes('PortfolioWorkFrontmatter') && contentTypes.includes('work?: PortfolioWorkFrontmatter'))
check('card source avoids object leaks', !card.includes('{{ card }}') && !grid.includes('[object Object]'))

const packageJson = JSON.parse(read('package.json'))
check('package has smoke:works-collection', packageJson.scripts['smoke:works-collection'] === 'node scripts/smoke-works-collection.mjs')
const checkLaunch = read('scripts/check-launch.mjs')
check('check:launch runs works collection smoke', checkLaunch.includes('scripts/smoke-works-collection.mjs'))

if (failures.length) {
  console.error('smoke:works-collection FAILED')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log(`smoke:works-collection OK — ${checks.length} checks`)
