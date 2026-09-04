#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
let pass = 0
const failures = []
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8').replace(/\\r\\n/g, '\\n')
function check(label, ok) {
  if (ok) { pass++; console.log('PASS ' + label) }
  else { failures.push(label); console.error('FAIL ' + label) }
}

const home = read('src/pages/HomePage.vue')
const exposure = read('src/content/exposureTaxonomy.ts')
const collection = read('src/composables/usePublicContentCollection.ts')
const markdownPage = read('src/pages/MarkdownPage.vue')
const homeCollections = read('src/composables/useHomeCollections.ts')
const projection = read('scripts/build-public-content-projection.mjs')
const homeBuilder = read('scripts/build-home-collections.mjs')
const inventory = read('scripts/generate-content-page-inventory.mjs')
const publicIndex = read('scripts/build-public-content-index.mjs')
const showroom = read('src/content/pages/works/varuntools-showroom/index.md')
const wiper = read('src/content/pages/wiper/index.md')
const lab = read('src/content/pages/lab-markdown-gallery/index.md')

check('home recent render edge retired', !home.includes('HomeRecentPublicContent'))
check('editorial discoverability type exists', exposure.includes("EditorialDiscoverability = 'listed' | 'unlisted' | 'internal'"))
check('public collection uses listed predicate', collection.includes('.filter(isEditorialListingEligible)'))
check('internal direct route blocked', markdownPage.includes('isPublicRouteEligible'))
check('related list is listed-only', markdownPage.includes('loadedPages.filter(isEditorialListingEligible)'))
check('home collection rejects routeOnly', homeCollections.includes("entry.routeOnly || entry.collection === 'none'"))
check('projection carries routeOnly', projection.includes('routeOnly,'))
check('home builder carries routeOnly', homeBuilder.includes('routeOnly: entry.routeOnly === true'))
check('inventory excludes routeOnly', inventory.includes('!exposure.routeOnly'))
check('public index excludes routeOnly', publicIndex.includes("entry.routeOnly === true || entry.collection === 'none'"))
check('showroom internal', /visibility:\s*["']hidden["']/.test(showroom) && /featured:\s*false/.test(showroom))
check('lab internal', /visibility:\s*["']hidden["']/.test(lab) && /featured:\s*false/.test(lab))
check('wiper remains public route', /visibility:\s*["']public["']/.test(wiper) && /route:\s*true/.test(wiper))
check('wiper unlisted routeOnly', /collection:\s*["']none["']/.test(wiper) && /routeOnly:\s*true/.test(wiper))
check('wiper discovery off', /search:\s*false/.test(wiper) && /sitemap:\s*false/.test(wiper) && /featured:\s*false/.test(wiper))
check('wiper noindex', /robots:\s*["']noindex,follow["']/.test(wiper))

if (failures.length) {
  console.error('VT-PUBLIC-24 FAILED ' + pass + '/' + (pass + failures.length) + ': ' + failures.join(', '))
  process.exit(1)
}
console.log('VT-PUBLIC-24 PASS ' + pass + '/' + pass)
