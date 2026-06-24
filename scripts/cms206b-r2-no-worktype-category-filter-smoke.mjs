#!/usr/bin/env node
import fs from 'node:fs'

function fail(message) {
  console.error('[CMS206B_R2_NO_WORKTYPE_CATEGORY_FILTER_FAIL]', message)
  process.exit(1)
}

const publicCollection = fs.readFileSync('src/composables/usePublicContentCollection.ts', 'utf8')
const contentSearch = fs.readFileSync('src/components/content/ContentSearchPanel.vue', 'utf8')
const indexPage = fs.readFileSync('src/pages/PublicContentIndexPage.vue', 'utf8')
const worksCollection = fs.readFileSync('src/composables/useWorksCollection.ts', 'utf8')

if (publicCollection.includes("buildFacetIndex(allEntries.value, 'type')")) fail('public category filter uses work type facet')
if (contentSearch.includes('selectedType')) fail('ContentSearchPanel must use selectedCategory, not selectedType')
if (contentSearch.includes('getWorkCategoryLabel')) fail('ContentSearchPanel must not use work category labels')
if (indexPage.includes('WorkTaxonomyBadge')) fail('PublicContentIndexPage must not use WorkTaxonomyBadge')
if (worksCollection.includes('getGeneratedWorkCardEntries') || worksCollection.includes('loadGeneratedPages')) fail('useWorksCollection must not merge generated work entries')
console.log('CMS206B_R2_NO_WORKTYPE_CATEGORY_FILTER_PASS')
