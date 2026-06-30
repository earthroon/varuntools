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

const pageIndex = read('src/navigation/pageIndex.ts')
const siteHeader = read('src/components/layout/SiteHeader.vue')
const sectionNavigation = read('src/navigation/sectionNavigation.ts')

const homeBlockMatch = pageIndex.match(/\{\s*id:\s*'home',[\s\S]*?description:\s*'바룬툴즈 홈\.',[\s\S]*?\n\s*\}/)

if (!homeBlockMatch) {
  throw new Error('FAIL home item: missing home navigation item')
}

const homeBlock = homeBlockMatch[0]

assertIncludes(homeBlock, "href: '/'", 'home keeps root href')
assertIncludes(homeBlock, "surface: ['hidden']", 'home is hidden surface')
assertNotIncludes(homeBlock, "'header'", 'home is not in header surface')
assertNotIncludes(homeBlock, "'footer'", 'home is not in footer surface')
assertNotIncludes(homeBlock, "'section'", 'home is not in section surface')

assertIncludes(
  siteHeader,
  '<RouterLink class="vt-site-header__brand" to="/"',
  'brand logo links to home route',
)

assertIncludes(
  siteHeader,
  'aria-label="VARUNTOOLS home"',
  'brand home aria-label is preserved',
)

assertIncludes(
  sectionNavigation,
  ".filter((item) => hasSurface(item, 'header'))",
  'header navigation remains surface-driven',
)

console.log('PASS VT-NAV-01_HIDE_HOME_TAB_LOGO_HOME_ENTRY')
