#!/usr/bin/env node
import fs from 'node:fs'

const PATCH_ID = 'CMS-207N'
const PASS_STATUS = 'PASS_CMS_207N_OBSERVED_HEADING_NAVIGATION'
const FILE = 'src/composables/useObservedHeadings.ts'

function fail(code, message) {
  console.error(`FAIL_${PATCH_ID}_OBSERVED_HEADING_NAVIGATION: ${code}`)
  console.error(message)
  process.exit(1)
}

if (!fs.existsSync(FILE)) fail('CMS_207N_OBSERVED_HEADINGS_COMPOSABLE_MISSING', `${FILE} is missing`)
const source = fs.readFileSync(FILE, 'utf8')

const required = [
  ['CMS_207N_MUTATION_OBSERVER_MISSING', 'MutationObserver'],
  ['CMS_207N_HEADING_SELECTOR_MISSING', 'h2, h3, h4'],
  ['CMS_207N_QUERY_SELECTOR_MISSING', 'querySelectorAll'],
  ['CMS_207N_AUTO_ID_MISSING', 'data-observed-heading-id'],
  ['CMS_207N_ARIA_HIDDEN_FILTER_MISSING', 'aria-hidden'],
  ['CMS_207N_TOC_HIDDEN_FILTER_MISSING', 'data-toc-hidden'],
  ['CMS_207N_REFRESH_API_MISSING', 'refreshObservedHeadings'],
  ['CMS_207N_CLEANUP_API_MISSING', 'cleanupObservedHeadings'],
]

for (const [code, marker] of required) {
  if (!source.includes(marker)) fail(code, `${FILE} does not contain ${marker}`)
}

if (!/observer\.observe\([^)]*\{[\s\S]*childList:\s*true[\s\S]*subtree:\s*true[\s\S]*characterData:\s*true/.test(source)) {
  fail('CMS_207N_MUTATION_OBSERVER_OPTIONS_MISSING', 'MutationObserver must observe childList/subtree/characterData')
}

console.log(PASS_STATUS)
