#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const file = path.join(root, 'src/components/markdown/MarkdownDocumentView.vue')
const text = fs.readFileSync(file, 'utf8')

function assert(condition, message) {
  if (!condition) {
    console.error('[CMS-206B-R1] FAIL ' + message)
    process.exit(1)
  }
}

assert(text.includes("import { resolvePublicExposure } from '@/content/exposureTaxonomy'"), 'MarkdownDocumentView must import resolvePublicExposure')
assert(text.includes('const shouldUseWorkDetailFooter = computed(() => {'), 'MarkdownDocumentView must define shouldUseWorkDetailFooter gate')
assert(text.includes('if (!shouldUseWorkDetailFooter.value || !props.page) return null'), 'workDetailContext must be gated before context creation')
assert(text.includes("exposure.kind === 'work'"), 'gate must allow work kind')
assert(text.includes("exposure.kind === 'case-study'"), 'gate must allow case-study kind')
assert(!/const workDetailContext = computed\(\(\) => \{\s*if \(!props\.showRelatedFooter \|\| !props\.page\) return null\s*return getWorkDetailContext/.test(text), 'old broad workDetailContext gate must not remain')

console.log('CMS206B_R1_WORK_DETAIL_FOOTER_SCOPE_PASS')
