#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const exists = (file) => fs.existsSync(path.join(root, file))
const failures = []
function check(name, condition) {
  if (!condition) failures.push(name)
}

const utilPath = 'src/utils/portfolioSearch.ts'
const composablePath = 'src/composables/usePortfolioSearch.ts'
const panelPath = 'src/components/works/WorksSearchPanel.vue'
const worksPagePath = 'src/pages/WorksPage.vue'
const worksCollectionPath = 'src/composables/useWorksCollection.ts'
const cssPath = 'src/styles/markdown-works.css'

check('portfolioSearch util exists', exists(utilPath))
check('usePortfolioSearch composable exists', exists(composablePath))
check('WorksSearchPanel exists', exists(panelPath))

const util = read(utilPath)
const composable = read(composablePath)
const panel = read(panelPath)
const worksPage = read(worksPagePath)
const worksCollection = read(worksCollectionPath)
const css = read(cssPath)
const packageJson = JSON.parse(read('package.json'))
const checkLaunch = read('scripts/check-launch.mjs')

check('normalizeSearchText lowercases and preserves unicode text', util.includes('.toLowerCase()') && util.includes("normalize('NFKC')"))
check('search text includes title', util.includes('entry.title'))
check('search text includes summary', util.includes('entry.summary'))
check('search text includes tags', util.includes('...entry.tags'))
check('search text includes stack', util.includes('...entry.stack'))
check('search text includes role', util.includes('...entry.role'))
check('search text includes tools', util.includes('...entry.tools'))
check('query matching uses includes', util.includes('.includes(normalizedQuery)'))
check('facet index type supported', util.includes("'type'"))
check('facet index tags supported', util.includes("'tags'"))
check('facet index stack supported', util.includes("'stack'"))
check('facet index role supported', util.includes("'role'"))
check('facet index year supported', util.includes("'year'"))
check('facet items include count', util.includes('count: number') && util.includes('counts.set'))
check('filter applies selected type', util.includes('selectedType'))
check('filter applies selected tag', util.includes('selectedTag'))
check('filter applies selected stack', util.includes('selectedStack'))
check('filter applies selected role', util.includes('selectedRole'))
check('filter applies featured only', util.includes('featuredOnly'))

check('usePortfolioSearch exposes resetSearch', composable.includes('resetSearch'))
check('usePortfolioSearch builds tag facets', composable.includes("buildFacetIndex(entries.value, 'tags')"))
check('usePortfolioSearch filters entries', composable.includes('filterPortfolioEntries(entries.value'))

check('WorksSearchPanel has search input', panel.includes('type="search"'))
check('WorksSearchPanel has result count live region', panel.includes('aria-live="polite"'))
check('WorksSearchPanel shows facet counts', panel.includes('{{ item.count }}'))
check('WorksSearchPanel reset button type button', panel.includes('type="button"') && panel.includes('Reset'))
check('WorksSearchPanel has accessible label text', panel.includes('<span>Search</span>'))

check('WorksPage imports WorksSearchPanel', worksPage.includes('WorksSearchPanel'))
check('WorksPage passes facet options', worksPage.includes(':tag-options="tagOptions"') && worksPage.includes(':stack-options="stackOptions"'))
check('WorksPage passes filtered entries', worksPage.includes(':entries="filteredEntries"'))

check('useWorksCollection uses portfolioSearch util', worksCollection.includes("@/utils/portfolioSearch"))
check('useWorksCollection returns facet count options', worksCollection.includes('tagOptions') && worksCollection.includes('stackOptions') && worksCollection.includes('typeOptions'))
check('useWorksCollection still preserves route query sync', worksCollection.includes('router.replace({ query: nextQuery })'))

check('works search CSS exists', css.includes('.vt-works-search'))
check('works search CSS uses vt tokens', css.includes('var(--vt-'))
check('works search CSS has focus-visible', css.includes(':focus-visible'))
check('works search CSS has mobile breakpoint', css.includes('@media (max-width: 720px)'))

check('package script exists', packageJson.scripts?.['smoke:portfolio-search'] === 'node scripts/smoke-portfolio-search.mjs')
check('check-launch includes portfolio search smoke', checkLaunch.includes('smoke-portfolio-search.mjs'))
check('source has no object leakage', ![util, composable, panel, worksPage, worksCollection].join('\n').includes('[object Object]'))

if (failures.length) {
  console.error('smoke:portfolio-search FAILED')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('[smoke:portfolio-search] PASS')
