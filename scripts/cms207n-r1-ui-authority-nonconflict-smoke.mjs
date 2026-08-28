#!/usr/bin/env node
import fs from 'node:fs'

const CMS207N = 'scripts/cms207n-works-page-toc-smoke.mjs'
const UI21A_R2 = 'scripts/smoke-vt-ui-21a-r2-work-index-page-side-scroll-anchor.mjs'

function fail(code, message) {
  console.error(`FAIL_CMS_207N_R1_UI_AUTHORITY_NONCONFLICT: ${code}`)
  console.error(message)
  process.exit(1)
}

for (const file of [CMS207N, UI21A_R2]) {
  if (!fs.existsSync(file)) fail('E_CMS207N_R1_CONTRACT_FILE_MISSING', `${file} is missing`)
}

const cms = fs.readFileSync(CMS207N, 'utf8')
const ui = fs.readFileSync(UI21A_R2, 'utf8')

for (const stale of [
  'CMS_207N_WORKS_FILTER_HEADING_MISSING',
  'WorksPage must expose 탐색 h2 heading',
]) {
  if (cms.includes(stale)) {
    fail('E_CMS207N_R1_STALE_POSITIVE_FILTER_CONTRACT', `CMS-207N still contains stale contract: ${stale}`)
  }
}

for (const marker of [
  'E_CMS207N_R1_STALE_INLINE_FILTER_HEADING_PRESENT',
  'WorkIndexDesktopStitchRail',
  'anchor-selector=".vt-work-index-main"',
  'works-results-heading',
]) {
  if (!cms.includes(marker)) {
    fail('E_CMS207N_R1_CURRENT_AUTHORITY_MARKER_MISSING', `CMS-207N-R1 contract is missing ${marker}`)
  }
}

if (!ui.includes('works-filter-heading') || !ui.includes('assertNotIncludes')) {
  fail(
    'E_CMS207N_R1_UI21A_R2_FILTER_RETIREMENT_AUTHORITY_MISSING',
    'VT-UI-21A-R2 must continue to forbid works-filter-heading.',
  )
}

for (const marker of [
  '<WorkIndexDesktopStitchRail',
  'anchor-selector=".vt-work-index-main"',
  'data-vt-ui21a-r2-work-index-main-anchor="true"',
]) {
  if (!ui.includes(marker)) {
    fail('E_CMS207N_R1_UI21A_R2_HANDOFF_MISSING', `VT-UI-21A-R2 is missing handoff marker ${marker}`)
  }
}

console.log('PASS_CMS_207N_R1_UI_AUTHORITY_NONCONFLICT')
