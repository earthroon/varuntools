#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const exists = (file) => fs.existsSync(path.join(root, file))
const checks = []
const failures = []
function check(name, ok) {
  checks.push(name)
  if (!ok) failures.push(name)
}

const directiveTypes = read('src/markdown/directiveTypes.ts')
const directivePlugin = read('src/markdown/directivePlugin.ts')
const directiveIndex = read('src/markdown/directives/index.ts')
const renderer = read('src/markdown/directives/fieldSpecDirective.ts')
const css = read('src/styles/markdown-components.css')
const fixture = read('src/markdown/__fixtures__/field-spec-directive.md')
const packageJson = JSON.parse(read('package.json'))

check('fieldSpecDirective.ts exists', exists('src/markdown/directives/fieldSpecDirective.ts'))
check('fixture exists', exists('src/markdown/__fixtures__/field-spec-directive.md'))
check('directiveTypes includes field-spec union', directiveTypes.includes("| 'field-spec'"))
check('KNOWN_DIRECTIVES includes field-spec', directiveTypes.includes("'field-spec',"))
check('BODY_DIRECTIVES includes field-spec', directivePlugin.includes("'field-spec'"))
check('directive index imports fieldSpecDirective', directiveIndex.includes("from './fieldSpecDirective'"))
check('directive index switches field-spec', directiveIndex.includes("case 'field-spec':"))
check('renderer exports renderFieldSpecDirective', renderer.includes('export function renderFieldSpecDirective'))
check('renderer requires name', renderer.includes("missing_name"))
check('renderer rejects invalid tags', renderer.includes('invalid_tag'))
check('renderer uses caption tag SSOT', renderer.includes("../captionTag") && renderer.includes('isCaptionTag'))
check('renderer does not define tooltip directive', !renderer.includes('renderTooltipDirective'))
check('renderer does not define badge directive', !renderer.includes('renderBadgeDirective'))
check('renderer uses escape helpers', renderer.includes('escapeHtml') && renderer.includes('attrValue') && renderer.includes('renderInvalidDirective'))
check('renderer outputs vt-field-spec', renderer.includes('vt-field-spec'))
check('css has vt-field-spec block', css.includes('.vt-field-spec'))
check('css has field spec tag styles', css.includes('.vt-field-spec__tag[data-type="필수"]') && css.includes('.vt-field-spec__tag[data-type="선택"]') && css.includes('.vt-field-spec__tag[data-type="기타"]'))
check('fixture contains required example', fixture.includes('tag: 필수') && fixture.includes('work.status'))
check('fixture contains optional example', fixture.includes('tag: 선택') && fixture.includes('thumbnail'))
check('package script exists', packageJson.scripts?.['smoke:field-spec-directive'] === 'node scripts/smoke-field-spec-directive.mjs')

if (failures.length) {
  console.error('smoke:field-spec-directive FAILED')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`[smoke:field-spec-directive] OK - ${checks.length} checks`)
