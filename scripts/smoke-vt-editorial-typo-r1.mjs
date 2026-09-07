#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const css = fs.readFileSync(path.join(root, 'src/styles/markdown-portfolio.css'), 'utf8')
const vue = fs.readFileSync(path.join(root, 'src/components/portfolio/EditorialTitle.vue'), 'utf8')

const checks = []
function check(name, ok) {
  checks.push({ name, ok: Boolean(ok) })
}

function block(selector) {
  const start = css.indexOf(selector)
  if (start < 0) return ''
  const open = css.indexOf('{', start)
  const close = css.indexOf('}', open)
  return open >= 0 && close >= 0 ? css.slice(open + 1, close) : ''
}

const subtitle = block('.vt-editorial-title__subtitle')
const heading = block('.vt-editorial-title__heading')
const major = block(".vt-editorial-title[data-level='major']")
const middle = block(".vt-editorial-title[data-level='middle']")
const minor = block(".vt-editorial-title[data-level='minor']")

check('subtitle semantic class remains in Vue', vue.includes('class="vt-editorial-title__subtitle"'))
check('subtitle font-size is 75 percent baseline curve', /font-size\s*:\s*clamp\(0\.75rem,\s*1\.5vw,\s*0\.9rem\)\s*;/.test(subtitle))
check('subtitle requests 97 percent font stretch', /font-stretch\s*:\s*97%\s*;/.test(subtitle))
check('subtitle line-height is 1.5', /line-height\s*:\s*1\.5\s*;/.test(subtitle))
check('subtitle max-width remains 48rem', /max-width\s*:\s*48rem\s*;/.test(subtitle))
check('subtitle margin remains 0.8rem 0 0', /margin\s*:\s*0\.8rem\s+0\s+0\s*;/.test(subtitle))
check('subtitle does not use scaleX fallback', !/transform\s*:\s*scaleX\(/.test(subtitle))
check('subtitle does not fake glyph width with letter-spacing -0.03em', !/letter-spacing\s*:\s*-0\.03em\s*;/.test(subtitle))

check('heading size authority unchanged', /font-size\s*:\s*var\(--vt-editorial-title-size\)\s*;/.test(heading))
check('heading line-height unchanged', /line-height\s*:\s*0\.98\s*;/.test(heading))
check('heading letter-spacing unchanged', /letter-spacing\s*:\s*-0\.055em\s*;/.test(heading))

check('major heading scale unchanged', /--vt-editorial-title-size\s*:\s*clamp\(2\.25rem,\s*8vw,\s*5rem\)\s*;/.test(major))
check('middle heading scale unchanged', /--vt-editorial-title-size\s*:\s*clamp\(1\.65rem,\s*4\.4vw,\s*2\.7rem\)\s*;/.test(middle))
check('minor heading scale unchanged', /--vt-editorial-title-size\s*:\s*clamp\(1\.18rem,\s*2\.8vw,\s*1\.55rem\)\s*;/.test(minor))

check('Vue has no inline typography style binding', !vue.includes(':style=') && !vue.includes('style='))
check('Vue has no subtitleScale prop', !vue.includes('subtitleScale'))
check('Vue has no subtitleWidth prop', !vue.includes('subtitleWidth'))
check('Vue has no subtitleLeading prop', !vue.includes('subtitleLeading'))

let failed = 0
for (const item of checks) {
  console.log(`${item.ok ? 'PASS' : 'FAIL'} ${item.name}`)
  if (!item.ok) failed += 1
}

if (failed) {
  console.error(`VT-EDITORIAL-TYPO-R1 smoke FAILED (${failed})`)
  process.exit(1)
}

console.log('PASS_VT_EDITORIAL_TYPO_R1')
