#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const failures = []
let passes = 0

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8').replace(/\\r\\n/g, '\\n')
}

function check(label, condition) {
  if (condition) {
    passes += 1
    console.log('PASS ' + label)
  } else {
    failures.push(label)
    console.error('FAIL ' + label)
  }
}

const home = read('src/pages/HomePage.vue')
const featured = read('src/components/home/HomeFeaturedWorks.vue')
const collections = read('src/composables/useHomeCollections.ts')
const generated = JSON.parse(read('src/content/generated/homeCollections.generated.json'))

check(
  'home featured edge exists',
  home.includes("import HomeFeaturedWorks from '@/components/home/HomeFeaturedWorks.vue'")
    && home.includes('<HomeFeaturedWorks />'),
)
check('home recent edge remains retired', !home.includes('HomeRecentPublicContent'))
check(
  'featured section no-renders on zero candidates',
  featured.includes('v-if="visibleWorks.length"'),
)
check(
  'featured section keeps four-card default cap',
  featured.includes('limit: 4')
    && featured.includes('featuredWorks.value.slice(0, props.limit)'),
)
check(
  'public copy hides implementation terminology',
  featured.includes("description: '선별한 주요 작업입니다.'")
    && !featured.includes('frontmatter.work 기준'),
)
check(
  'listed boundary precedes featured admission',
  collections.includes("entry.editorialVisibility !== 'listed'")
    && collections.includes("entry.routeOnly || entry.collection === 'none'"),
)
check(
  'featured admission is explicit',
  collections.includes('if (!entry.featured) return false')
    && collections.includes('.filter(isHomeFeaturedAdmissionEntry)'),
)
check(
  'featured admission is work-like only',
  collections.includes('function isHomeFeaturedWorkLike(')
    && collections.includes("entry.category === 'work'")
    && collections.includes("entry.category === 'case-study'"),
)
check(
  'featured page/work lifecycle is active or published',
  collections.includes("const HOME_FEATURED_ACTIVE_STATUSES = new Set(['active', 'published'])")
    && collections.includes('HOME_FEATURED_ACTIVE_STATUSES.has(entry.status)')
    && collections.includes('HOME_FEATURED_ACTIVE_STATUSES.has(entry.work.status)'),
)
check(
  'no known slug quarantine is used',
  !collections.includes("entry.slug !== 'wiper'")
    && !collections.includes("entry.slug !== 'lab-markdown-gallery'")
    && !collections.includes("entry.slug !== 'works/varuntools-showroom'")
    && !collections.includes('hiddenSlugs')
    && !collections.includes('blockedSlugs'),
)

const entries = Array.isArray(generated.entries) ? generated.entries : []
const active = new Set(['active', 'published'])
function isEligible(entry) {
  const work = entry && typeof entry.work === 'object' && entry.work ? entry.work : {}
  const workLike = Boolean(work.hasWorkMetadata)
    || entry.category === 'work'
    || entry.category === 'case-study'
    || entry.kind === 'work'
    || entry.kind === 'case-study'

  return entry.visibility === 'public'
    && entry.editorialVisibility === 'listed'
    && entry.routeOnly !== true
    && entry.collection !== 'none'
    && entry.featured === true
    && workLike
    && active.has(String(entry.status || ''))
    && active.has(String(work.status || ''))
}

const candidates = entries.filter(isEligible)
const forbidden = new Set([
  'works/varuntools-showroom',
  'wiper',
  'lab-markdown-gallery',
])
check(
  'current internal/unlisted fixtures cannot enter home featured',
  candidates.every((entry) => !forbidden.has(entry.slug)),
)

console.log('INFO homeFeaturedCandidateCount=' + candidates.length)
if (candidates.length === 0) {
  console.log('INFO no fabricated seed work: add a real listed+featured work/case-study to materialize the section')
}

if (failures.length) {
  console.error(
    'VT-PUBLIC-24-R1 FAILED '
      + passes
      + '/'
      + (passes + failures.length)
      + ': '
      + failures.join(', '),
  )
  process.exit(1)
}

console.log('VT-PUBLIC-24-R1 PASS ' + passes + '/' + passes)
