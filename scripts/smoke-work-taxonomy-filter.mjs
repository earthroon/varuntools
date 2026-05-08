#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const objectLeak = '[' + 'object Object' + ']'
const requiredFiles = [
  'src/types/workTaxonomy.ts',
  'src/data/workTaxonomy.ts',
  'src/utils/workFilters.ts',
  'src/components/portfolio/WorkFilterChip.vue',
  'src/components/portfolio/WorkTaxonomyBadge.vue',
  'src/components/portfolio/WorkEmptyState.vue',
  'src/components/works/WorksSearchPanel.vue',
  'src/components/works/WorksCollectionGrid.vue',
  'src/content/pages/works/index.md',
  'src/content/pages/works/varuntools-showroom/index.md',
  'src/content/pages/wiper/index.md',
  'src/content/pages/lab-markdown-gallery/index.md',
  'src/markdown/__fixtures__/portfolio-work-taxonomy-filter.md',
  'docs/authoring/work-taxonomy-filter.md',
  'docs/migration/commit-130.md',
  'BAKE_REPORT_COMMIT_130.md',
]

const issues = []
function read(file) {
  const full = path.join(root, file)
  if (!fs.existsSync(full)) {
    issues.push(`Missing ${file}`)
    return ''
  }
  return fs.readFileSync(full, 'utf8')
}

for (const file of requiredFiles) read(file)

const taxonomyTypes = read('src/types/workTaxonomy.ts')
for (const token of [
  'WorkCategory',
  'WorkRole',
  'WorkStack',
  'WorkFilterState',
  "'design'",
  "'tool'",
  "'system'",
  "'writing'",
  "'commerce'",
  "'experiment'",
]) {
  if (!taxonomyTypes.includes(token)) issues.push(`workTaxonomy.ts missing ${token}`)
}

const taxonomyData = read('src/data/workTaxonomy.ts')
for (const token of ['workCategoryOptions', 'workRoleOptions', 'workStackOptions', 'getWorkCategoryLabel', 'knownWorkCategories']) {
  if (!taxonomyData.includes(token)) issues.push(`workTaxonomy.ts registry missing ${token}`)
}

const workFilters = read('src/utils/workFilters.ts')
for (const token of [
  'defaultWorkFilterState',
  'getWorkTaxonomyRecord',
  'isFilterableWork',
  'filterWorks',
  'parseWorkFilterQuery',
  'editorial-showcase',
  'dummy',
  'playground',
  'spec',
]) {
  if (!workFilters.includes(token)) issues.push(`workFilters.ts missing ${token}`)
}

const useWorksCollection = read('src/composables/useWorksCollection.ts')
if (!useWorksCollection.includes("@/utils/workFilters")) issues.push('useWorksCollection does not import workFilters')
if (!useWorksCollection.includes('filterWorks(allEntries.value')) issues.push('useWorksCollection does not call filterWorks')

const searchPanel = read('src/components/works/WorksSearchPanel.vue')
for (const token of ['WorkFilterChip', 'WorkTaxonomyBadge', 'activeFilterChips', 'Category', 'getWorkCategoryLabel', 'getWorkRoleLabel', 'getWorkStackLabel']) {
  if (!searchPanel.includes(token)) issues.push(`WorksSearchPanel missing ${token}`)
}

const grid = read('src/components/works/WorksCollectionGrid.vue')
if (!grid.includes('WorkEmptyState')) issues.push('WorksCollectionGrid does not use WorkEmptyState')

const css = read('src/styles/markdown-works.css')
for (const token of ['vt-work-filter-chip', 'vt-work-taxonomy-badge', 'vt-work-empty-state']) {
  if (!css.includes(token)) issues.push(`markdown-works.css missing ${token}`)
}

for (const file of [
  'src/content/pages/works/varuntools-showroom/index.md',
  'src/content/pages/wiper/index.md',
  'src/content/pages/lab-markdown-gallery/index.md',
]) {
  const body = read(file)
  for (const token of ['work:', 'type:', 'category:', 'role:', 'stack:', 'tags:']) {
    if (!body.includes(token)) issues.push(`${file} missing taxonomy token ${token}`)
  }
}

const hiddenShowcase = read('src/content/pages/works/editorial-showcase/index.md')
if (!hiddenShowcase.includes('visibility: "hidden"')) issues.push('editorial showcase visibility guard missing')
if (!workFilters.includes("work.visibility === 'hidden'")) issues.push('filterWorks hidden guard missing')

const pkg = JSON.parse(read('package.json'))
if (pkg.scripts?.['smoke:work-taxonomy-filter'] !== 'node scripts/smoke-work-taxonomy-filter.mjs') {
  issues.push('package.json missing smoke:work-taxonomy-filter')
}

const checkLaunch = read('scripts/check-launch.mjs')
if (!checkLaunch.includes('smoke-work-taxonomy-filter.mjs')) issues.push('check-launch missing smoke-work-taxonomy-filter')

const allScanned = requiredFiles.concat([
  'src/composables/useWorksCollection.ts',
  'src/styles/markdown-works.css',
  'scripts/check-launch.mjs',
]).map(read).join('\n')
if (allScanned.includes(objectLeak)) issues.push('source contains object serialization leak token')

if (issues.length) {
  console.error('[smoke:work-taxonomy-filter] failed')
  for (const issue of issues) console.error(`- ${issue}`)
  process.exit(1)
}

console.log('[smoke:work-taxonomy-filter] ok')
