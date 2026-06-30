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

const worksPage = read('src/pages/WorksPage.vue')
const rail = read('src/components/content/WorkIndexDesktopStitchRail.vue')
const panel = read('src/components/content/ContentSearchPanel.vue')

assertIncludes(
  worksPage,
  '<WorkIndexDesktopStitchRail',
  'WorksPage renders desktop stitch rail',
)

assertIncludes(
  worksPage,
  'anchor-selector=".vt-work-index-main"',
  'WorksPage anchors rail to page container side',
)

assertIncludes(
  worksPage,
  'data-vt-ui21a-r2-work-index-main-anchor="true"',
  'WorksPage marks main as rail anchor',
)

assertNotIncludes(
  worksPage,
  'grid-template-columns: minmax(220px, 280px) minmax(0, 1fr)',
  'WorksPage does not push page body with a grid rail column',
)

assertNotIncludes(
  worksPage,
  'works-filter-heading',
  'WorksPage keeps inline explore section removed',
)

assertIncludes(
  rail,
  'const RAIL_WIDTH_PX = 224',
  'Rail uses fixed page-side width constant',
)

assertIncludes(
  rail,
  'anchorRect.left - RAIL_WIDTH_PX - RAIL_GAP_PX',
  'Rail places itself to the left side of main page container',
)

assertIncludes(
  rail,
  "position: 'fixed'",
  'Rail follows viewport scroll through Vue-owned style',
)

assertIncludes(
  rail,
  "window.addEventListener('scroll', scheduleRailSync",
  'Rail syncs on scroll',
)

assertIncludes(
  rail,
  'requestAnimationFrame',
  'Rail throttles scroll sync through requestAnimationFrame',
)

assertIncludes(
  rail,
  'page-side-scroll-anchor',
  'Rail exposes page-side scroll receipt marker',
)

assertIncludes(
  panel,
  "surface?: 'inline' | 'desktop-stitch'",
  'ContentSearchPanel keeps desktop stitch surface mode',
)

for (const forbidden of [
  'mobile-drawer',
  'useWorkIndexControlRegistry',
  'registerWorkIndexControlSurface',
]) {
  assertNotIncludes(worksPage, forbidden, `WorksPage avoids ${forbidden}`)
  assertNotIncludes(rail, forbidden, `Rail avoids ${forbidden}`)
}

console.log('PASS VT-UI-21A-R2_WORK_INDEX_PAGE_SIDE_SCROLL_ANCHOR')
