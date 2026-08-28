#!/usr/bin/env node
import fs from 'node:fs'

const PATCH_ID = 'CMS-207N-R1'
const PASS_STATUS = 'PASS_CMS_207N_R1_WORKS_TOC_CURRENT_UI_AUTHORITY_REALIGNMENT'
const FILE = 'src/pages/WorksPage.vue'

function fail(code, message) {
  console.error(`FAIL_${PATCH_ID}_WORKS_PAGE_TOC: ${code}`)
  console.error(message)
  process.exit(1)
}

function requireMarker(source, marker, code) {
  if (!source.includes(marker)) fail(code, `${FILE} does not contain ${marker}`)
}

if (!fs.existsSync(FILE)) fail('E_CMS207N_R1_WORKS_PAGE_MISSING', `${FILE} is missing`)
const source = fs.readFileSync(FILE, 'utf8')

const required = [
  ['MarkdownToc', 'E_CMS207N_R1_MARKDOWN_TOC_IMPORT_MISSING'],
  ['useObservedHeadings', 'E_CMS207N_R1_OBSERVED_HEADINGS_IMPORT_MISSING'],
  ['useActiveHeading', 'E_CMS207N_R1_ACTIVE_HEADING_IMPORT_MISSING'],
  ['const worksRoot', 'E_CMS207N_R1_WORKS_ROOT_MISSING'],
  ['useObservedHeadings(worksRoot)', 'E_CMS207N_R1_OBSERVED_HEADINGS_BINDING_MISSING'],
  ['useActiveHeading(worksRoot, headings)', 'E_CMS207N_R1_ACTIVE_HEADING_BINDING_MISSING'],
  ['<MarkdownToc', 'E_CMS207N_R1_MARKDOWN_TOC_RENDER_MISSING'],
  [':headings="headings"', 'E_CMS207N_R1_MARKDOWN_TOC_HEADINGS_BINDING_MISSING'],
  [':active-heading-id="activeHeadingId"', 'E_CMS207N_R1_MARKDOWN_TOC_ACTIVE_BINDING_MISSING'],
  ['WorkIndexDesktopStitchRail', 'E_CMS207N_R1_EXPLORE_RAIL_IMPORT_MISSING'],
  ['<WorkIndexDesktopStitchRail', 'E_CMS207N_R1_EXPLORE_RAIL_RENDER_MISSING'],
  ['anchor-selector=".vt-work-index-main"', 'E_CMS207N_R1_EXPLORE_RAIL_ANCHOR_MISSING'],
  ['ref="worksRoot"', 'E_CMS207N_R1_WORKS_ROOT_REF_MISSING'],
  ['vt-work-index-main', 'E_CMS207N_R1_MAIN_ANCHOR_CLASS_MISSING'],
  ['data-vt-ui21a-r2-work-index-main-anchor="true"', 'E_CMS207N_R1_MAIN_ANCHOR_MISSING'],
  ['works-results-heading', 'E_CMS207N_R1_RESULTS_HEADING_MISSING'],
  ['aria-labelledby="works-results-heading"', 'E_CMS207N_R1_RESULTS_ARIA_BINDING_MISSING'],
]

for (const [marker, code] of required) requireMarker(source, marker, code)

if (source.includes('works-filter-heading')) {
  fail(
    'E_CMS207N_R1_STALE_INLINE_FILTER_HEADING_PRESENT',
    'WorksPage must keep the retired inline filter heading absent; exploration belongs to WorkIndexDesktopStitchRail.',
  )
}

if (!/<h2[^>]*id=["']works-results-heading["'][^>]*>\s*공개 콘텐츠\s*<\/h2>/.test(source)) {
  fail(
    'E_CMS207N_R1_RESULTS_HEADING_LABEL_MISMATCH',
    'WorksPage must preserve the visible 공개 콘텐츠 h2 bound to works-results-heading.',
  )
}

const mainMatch = source.match(/<main\b[^>]*ref=["']worksRoot["'][^>]*>[\s\S]*?<\/main>/)
if (!mainMatch) {
  fail('E_CMS207N_R1_WORKS_ROOT_SCOPE_MISSING', 'WorksPage must expose a main element owned by worksRoot.')
}
if (!mainMatch[0].includes('id="works-results-heading"') && !mainMatch[0].includes("id='works-results-heading'")) {
  fail(
    'E_CMS207N_R1_RESULTS_HEADING_OUTSIDE_OBSERVED_ROOT',
    'works-results-heading must remain inside the worksRoot observation scope.',
  )
}

console.log(PASS_STATUS)
