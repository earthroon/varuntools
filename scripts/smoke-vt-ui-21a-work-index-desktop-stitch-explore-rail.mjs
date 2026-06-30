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

const worksPagePath = 'src/pages/WorksPage.vue'
const panelPath = 'src/components/content/ContentSearchPanel.vue'
const railPath = 'src/components/content/WorkIndexDesktopStitchRail.vue'

const worksPage = read(worksPagePath)
const panel = read(panelPath)

if (!fs.existsSync(railPath)) {
  throw new Error(`FAIL rail: missing ${railPath}`)
}

const rail = read(railPath)

assertIncludes(
  worksPage,
  "import WorkIndexDesktopStitchRail from '@/components/content/WorkIndexDesktopStitchRail.vue'",
  'WorksPage imports desktop stitch rail',
)

assertIncludes(
  worksPage,
  '<WorkIndexDesktopStitchRail',
  'WorksPage renders desktop stitch rail',
)

assertNotIncludes(
  worksPage,
  "import ContentSearchPanel from '@/components/content/ContentSearchPanel.vue'",
  'WorksPage does not import ContentSearchPanel directly',
)

assertNotIncludes(
  worksPage,
  'works-filter-heading',
  'WorksPage removes inline explore section heading',
)

assertIncludes(
  worksPage,
  'data-vt-ui21a-work-index-shell="desktop-stitch-boundary"',
  'WorksPage has page-bound stitch shell marker',
)

assertIncludes(
  worksPage,
  'vt-work-index-main',
  'WorksPage has main content class',
)

assertIncludes(
  rail,
  "import ContentSearchPanel from '@/components/content/ContentSearchPanel.vue'",
  'Rail reuses ContentSearchPanel',
)

assertIncludes(
  rail,
  'data-vt-ui21a-work-index-desktop-stitch-rail="true"',
  'Rail has receipt data marker',
)

assertIncludes(
  rail,
  '@media (min-width: 1120px)',
  'Rail is desktop-only',
)

assertIncludes(
  rail,
  'position: sticky',
  'Rail is page-scroll sticky',
)

assertIncludes(
  rail,
  'top: calc(var(--vt-header-height',
  'Rail follows header offset',
)

assertIncludes(
  panel,
  "surface?: 'inline' | 'desktop-stitch'",
  'ContentSearchPanel supports desktop stitch surface',
)

assertIncludes(
  panel,
  'vt-works-search--desktop-stitch',
  'ContentSearchPanel has desktop stitch class',
)

for (const forbidden of [
  'mobile-drawer',
  'useWorkIndexControlRegistry',
  'registerWorkIndexControlSurface',
]) {
  assertNotIncludes(worksPage, forbidden, `WorksPage avoids ${forbidden}`)
  assertNotIncludes(rail, forbidden, `Rail avoids ${forbidden}`)
}

console.log('PASS VT-UI-21A_WORK_INDEX_DESKTOP_STITCH_EXPLORE_RAIL')
