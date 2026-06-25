#!/usr/bin/env node
import fs from 'node:fs'

const PATCH_ID = 'CMS-207N'
const PASS_STATUS = 'PASS_CMS_207N_RUNTIME_MARKDOWN_HEADING_OBSERVER'
const FILE = 'src/components/markdown/MarkdownDocumentView.vue'

function fail(code, message) {
  console.error(`FAIL_${PATCH_ID}_RUNTIME_MARKDOWN_HEADING_OBSERVER: ${code}`)
  console.error(message)
  process.exit(1)
}

if (!fs.existsSync(FILE)) fail('CMS_207N_MARKDOWN_DOCUMENT_VIEW_MISSING', `${FILE} is missing`)
const source = fs.readFileSync(FILE, 'utf8')

const required = [
  ['CMS_207N_MARKDOWN_OBSERVED_HEADINGS_MISSING', 'useObservedHeadings'],
  ['CMS_207N_MARKDOWN_OBSERVED_HEADINGS_REF_MISSING', 'observedHeadings'],
  ['CMS_207N_MARKDOWN_COMPILED_FALLBACK_MISSING', 'compiledHeadings'],
  ['CMS_207N_MARKDOWN_REFRESH_MISSING', 'refreshObservedHeadings'],
  ['CMS_207N_ACTIVE_HEADING_REFRESH_MISSING', 'refreshActiveHeading'],
  ['CMS_207N_MARKDOWN_TOC_HEADINGS_BINDING_MISSING', ':headings="headings"'],
]

for (const [code, marker] of required) {
  if (!source.includes(marker)) fail(code, `${FILE} does not contain ${marker}`)
}

if (!/observedHeadings\.value\.length\s*>\s*0[\s\S]*observedHeadings\.value[\s\S]*compiledHeadings\.value/.test(source)) {
  fail('CMS_207N_MARKDOWN_OBSERVED_PRIORITY_MISSING', 'MarkdownDocumentView must prefer observed headings with compiled fallback')
}

const observedIndex = source.indexOf('await refreshObservedHeadings()')
const activeIndex = source.indexOf('await refreshActiveHeading()')
if (observedIndex < 0 || activeIndex < 0 || observedIndex > activeIndex) {
  fail('CMS_207N_REFRESH_ORDER_INVALID', 'refreshObservedHeadings must run before refreshActiveHeading')
}

console.log(PASS_STATUS)
