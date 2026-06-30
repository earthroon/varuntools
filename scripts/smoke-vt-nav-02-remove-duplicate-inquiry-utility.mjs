import fs from 'node:fs'

function read(path) {
  return fs.readFileSync(path, 'utf8')
}

function assertIncludes(source, token, label) {
  if (!source.includes(token)) {
    throw new Error(`FAIL ${label}: missing token ${token}`)
  }
}

function assertNotIncludes(source, token, label) {
  if (source.includes(token)) {
    throw new Error(`FAIL ${label}: forbidden token ${token}`)
  }
}

function findNavBlock(source, id, description) {
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const escapedDescription = description.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = source.match(new RegExp(`id:\\s*'${escapedId}'[\\s\\S]*?description:\\s*'${escapedDescription}',[\\s\\S]*?\\n\\s*\\}`))
  if (!match) {
    throw new Error(`FAIL ${id} item: missing navigation item block`)
  }
  return match[0]
}

const pageIndex = read('src/navigation/pageIndex.ts')
const siteHeader = read('src/components/layout/SiteHeader.vue')
const sectionNavigation = read('src/navigation/sectionNavigation.ts')

const inquiryBlock = findNavBlock(pageIndex, 'inquiry', '문의 접수 폼.')

assertIncludes(inquiryBlock, "href: '/inquiry'", 'inquiry keeps inquiry href')
assertIncludes(inquiryBlock, "section: 'inquiry'", 'inquiry keeps inquiry section')
assertIncludes(inquiryBlock, "surface: ['header', 'footer']", 'inquiry remains primary/footer only')
assertIncludes(inquiryBlock, "'header'", 'inquiry remains in header navigation')
assertNotIncludes(inquiryBlock, "'utility'", 'inquiry is removed from utility surface')

assertIncludes(
  siteHeader,
  'const hasUtilityNavigation = computed(() => utilityNavigation.length > 0)',
  'SiteHeader computes utility nav presence',
)

assertIncludes(
  siteHeader,
  'v-if="hasUtilityNavigation"',
  'SiteHeader renders utility nav only when non-empty',
)

assertIncludes(
  siteHeader,
  'data-vt-nav-02-utility-nav-guard="non-empty-only"',
  'SiteHeader has VT-NAV-02 utility nav receipt marker',
)

assertIncludes(
  sectionNavigation,
  ".filter((item) => hasSurface(item, 'utility'))",
  'utility navigation remains surface-driven',
)

console.log('PASS VT-NAV-02_REMOVE_DUPLICATE_INQUIRY_UTILITY')
