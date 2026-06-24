#!/usr/bin/env node
import fs from 'node:fs'

function fail(message) {
  console.error('[CMS206B_R4_WORKTYPE_FILTER_REMOVAL_FAIL]', message)
  process.exit(1)
}

const worksPage = fs.readFileSync('src/pages/WorksPage.vue', 'utf8')
const contentSearch = fs.readFileSync('src/components/content/ContentSearchPanel.vue', 'utf8')
const publicCollection = fs.readFileSync('src/composables/usePublicContentCollection.ts', 'utf8')

if (worksPage.includes('typeOptions')) fail('WorksPage must not use typeOptions')
if (contentSearch.includes('selectedType')) fail('ContentSearchPanel must not use selectedType')
if (contentSearch.includes('WorkTaxonomyBadge')) fail('ContentSearchPanel must not use WorkTaxonomyBadge')
if (contentSearch.includes('getWorkCategoryLabel')) fail('ContentSearchPanel must not use getWorkCategoryLabel')
if (publicCollection.includes("buildFacetIndex(allEntries.value, 'type')")) fail('public collection must not build category options from work type facet')
console.log('CMS206B_R4_WORKTYPE_FILTER_REMOVAL_PASS')
