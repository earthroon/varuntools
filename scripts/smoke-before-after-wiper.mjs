#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const vue = fs.readFileSync(path.join(root, 'src/components/markdown/BeforeAfterWiper.vue'), 'utf8')
const css = fs.readFileSync(path.join(root, 'src/styles/markdown-components.css'), 'utf8')
const before = fs.readFileSync(path.join(root, 'src/content/pages/lab-markdown-gallery/images/qa-before.svg'), 'utf8')
const after = fs.readFileSync(path.join(root, 'src/content/pages/lab-markdown-gallery/images/qa-after.svg'), 'utf8')
const beforeTall = fs.readFileSync(path.join(root, 'src/content/pages/lab-markdown-gallery/images/qa-before-tall.svg'), 'utf8')
const afterTall = fs.readFileSync(path.join(root, 'src/content/pages/lab-markdown-gallery/images/qa-after-tall.svg'), 'utf8')

const checks = [
  ['overlay contract marker', vue.includes('data-wiper-contract="overlay-clip"')],
  ['after clip-path computed', vue.includes('afterClipPath') && vue.includes('clipPath')],
  ['no after width wrapper', !vue.includes('class="vt-before-after__after"')],
  ['single shared stage ref', vue.includes('ref="stageEl"')],
  ['before image absolute layer', css.includes('.vt-before-after__image') && css.includes('position: absolute')],
  ['object fit cover', css.includes('object-fit: cover')],
  ['after z layer', css.includes('.vt-before-after__image--after') && css.includes('z-index: 2')],
  ['range input preserved', vue.includes('type="range"') && vue.includes(':aria-valuenow="roundedPct"')],
  ['no static BEFORE UI render', !/BEFORE|AFTER/.test(vue.replace(/alt="Before"|alt="After"/g, ''))],
  ['qa before has no visible label', !/>\s*BEFORE\s*</.test(before) && !/>\s*AFTER\s*</.test(before)],
  ['qa after has no visible label', !/>\s*BEFORE\s*</.test(after) && !/>\s*AFTER\s*</.test(after)],
  ['qa tall before has no visible label', !/>\s*TALL BEFORE\s*</.test(beforeTall) && !/>\s*TALL AFTER\s*</.test(beforeTall)],
  ['qa tall after has no visible label', !/>\s*TALL BEFORE\s*</.test(afterTall) && !/>\s*TALL AFTER\s*</.test(afterTall)],
]

const failed = checks.filter(([, ok]) => !ok)
if (failed.length) {
  for (const [name] of failed) console.error(`[before-after] missing: ${name}`)
  process.exit(1)
}

console.log(`[before-after] OK — ${checks.length} checks`)
