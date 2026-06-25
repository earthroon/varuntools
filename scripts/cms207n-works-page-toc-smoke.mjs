#!/usr/bin/env node
import fs from 'node:fs'

const PATCH_ID = 'CMS-207N'
const PASS_STATUS = 'PASS_CMS_207N_WORKS_PAGE_TOC'
const FILE = 'src/pages/WorksPage.vue'

function fail(code, message) {
  console.error(`FAIL_${PATCH_ID}_WORKS_PAGE_TOC: ${code}`)
  console.error(message)
  process.exit(1)
}

if (!fs.existsSync(FILE)) fail('CMS_207N_WORKS_PAGE_MISSING', `${FILE} is missing`)
const source = fs.readFileSync(FILE, 'utf8')

const required = [
  ['CMS_207N_WORKS_MARKDOWN_TOC_MISSING', 'MarkdownToc'],
  ['CMS_207N_WORKS_OBSERVED_HEADINGS_MISSING', 'useObservedHeadings'],
  ['CMS_207N_WORKS_ACTIVE_HEADING_MISSING', 'useActiveHeading'],
  ['CMS_207N_WORKS_ROOT_REF_MISSING', 'worksRoot'],
  ['CMS_207N_WORKS_TOC_RENDER_MISSING', '<MarkdownToc'],
  ['CMS_207N_WORKS_FILTER_HEADING_MISSING', 'works-filter-heading'],
  ['CMS_207N_WORKS_RESULTS_HEADING_MISSING', 'works-results-heading'],
]

for (const [code, marker] of required) {
  if (!source.includes(marker)) fail(code, `${FILE} does not contain ${marker}`)
}

if (!/<h2[^>]*id=["']works-filter-heading["'][\s\S]*?>탐색<\/h2>/.test(source)) {
  fail('CMS_207N_WORKS_SECTION_HEADINGS_MISSING', 'WorksPage must expose 탐색 h2 heading')
}
if (!/<h2[^>]*id=["']works-results-heading["'][\s\S]*?>공개 콘텐츠<\/h2>/.test(source)) {
  fail('CMS_207N_WORKS_SECTION_HEADINGS_MISSING', 'WorksPage must expose 공개 콘텐츠 h2 heading')
}

console.log(PASS_STATUS)
