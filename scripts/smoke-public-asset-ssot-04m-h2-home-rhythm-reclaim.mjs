#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const PATCH_ID = 'PUBLIC-ASSET-SSOT-04M-H2'
const PASS_TOKEN = 'PASS_PUBLIC_ASSET_SSOT_04M_H2_HOME_RHYTHM_RECLAIM'
const root = process.cwd()

function read(rel) {
  const full = path.join(root, rel)
  if (!fs.existsSync(full)) throw new Error(`[${PATCH_ID}] missing file: ${rel}`)
  return fs.readFileSync(full, 'utf8')
}

function assertIncludes(text, needle, label) {
  if (!text.includes(needle)) throw new Error(`[${PATCH_ID}] missing ${label}: ${needle}`)
}

function assertNotIncludes(text, needle, label) {
  if (text.includes(needle)) throw new Error(`[${PATCH_ID}] forbidden ${label}: ${needle}`)
}

const mdv = read('src/components/markdown/MarkdownDocumentView.vue')
assertIncludes(mdv, "pageShell?: 'default' | 'compact'", 'pageShell prop')
assertIncludes(mdv, "pageShell: 'default'", 'pageShell default')
assertIncludes(mdv, 'const articleClass = computed(', 'articleClass computed')
assertIncludes(mdv, "props.pageShell === 'compact' ? 'vt-markdown-page--compact' : ''", 'compact class binding')
assertIncludes(mdv, '<article :class="articleClass">', 'article dynamic class')

const home = read('src/pages/HomePage.vue')
assertIncludes(home, 'page-shell="compact"', 'HomePage compact shell binding')

const css = read('src/styles/markdown.css')
assertIncludes(css, 'PUBLIC-ASSET-SSOT-04M-H2 home rhythm reclaim:start', 'H2 css block start')
assertIncludes(css, '.vt-markdown-page--compact', 'compact shell css')
assertIncludes(css, 'min-height: 0;', 'compact min-height reset')
assertIncludes(css, 'padding-bottom: clamp(18px, 5vw, 32px);', 'mobile compact bottom rhythm')
assertNotIncludes(css, '/\\* PUBLIC-ASSET-SSOT-04M-U1-R2', 'escaped css comment token')

for (const rel of ['src/styles/markdown-works.css', 'src/styles/generated-content.css']) {
  if (!fs.existsSync(path.join(root, rel))) continue
  const text = read(rel)
  assertNotIncludes(text, '/\\* PUBLIC-ASSET-SSOT-04M-U1-R2', `${rel} escaped css comment token`)
}

console.log(PASS_TOKEN)
