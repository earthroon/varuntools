#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

const vue = read('src/components/markdown/CaptionedImage.vue')
const css = read('src/styles/markdown-components.css')
const sectionLightbox = read('src/composables/useSectionLightbox.ts')
const qa = read('src/content/pages/lab-markdown-gallery/index.md')

function appearsInsideFrame(source, token) {
  const frameIndex = source.indexOf('class="vt-captioned-image__frame"')
  const tokenIndex = source.indexOf(token)
  return frameIndex >= 0 && tokenIndex > frameIndex
}

const forbiddenSourcePatterns = [
  ['JS tooltip open state', 'isTooltipOpen'],
  ['openTooltip handler', 'openTooltip'],
  ['closeTooltip handler', 'closeTooltip'],
  ['tooltip aria-expanded', 'aria-expanded'],
  ['tooltip data-open binding', 'data-open'],
  ['mouseenter tooltip event', '@mouseenter'],
  ['mouseleave tooltip event', '@mouseleave'],
  ['focus tooltip open event', '@focus="openTooltip"'],
  ['blur tooltip close event', '@blur="closeTooltip"'],
]

const forbiddenCssPatterns = [
  ['figure hover tooltip trigger', '.vt-captioned-image:hover .vt-captioned-image__tooltip'],
  ['frame hover tooltip trigger', '.vt-captioned-image__frame:hover .vt-captioned-image__tooltip'],
  ['figure focus-within tooltip trigger', '.vt-captioned-image:focus-within .vt-captioned-image__tooltip'],
  ['frame focus-within tooltip trigger', '.vt-captioned-image__frame:focus-within .vt-captioned-image__tooltip'],
  ['tooltip data-open trigger', '.vt-captioned-image__tooltip[data-open'],
]

const checks = [
  ['CaptionedImage.vue exists', vue.length > 0],
  ['CaptionedImage has frame wrapper', vue.includes('vt-captioned-image__frame')],
  ['badge/chip rendered after frame wrapper', appearsInsideFrame(vue, 'vt-captioned-image__badge') || appearsInsideFrame(vue, 'vt-captioned-image__chip')],
  ['help button rendered after frame wrapper', appearsInsideFrame(vue, 'vt-captioned-image__help') || appearsInsideFrame(vue, 'vt-captioned-image__flag')],
  ['tooltip rendered after frame wrapper', appearsInsideFrame(vue, 'vt-captioned-image__tooltip')],
  ['tooltip role present', vue.includes('role="tooltip"')],
  ['help aria-describedby present', vue.includes(':aria-describedby="tooltipId"')],
  ['CSS opens tooltip only from help hover', css.includes('.vt-captioned-image__help:hover ~ .vt-captioned-image__tooltip')],
  ['CSS opens tooltip only from help focus-visible', css.includes('.vt-captioned-image__help:focus-visible ~ .vt-captioned-image__tooltip')],
  ['CSS frame is relative', /\.vt-captioned-image__frame\s*\{[\s\S]*position:\s*relative/.test(css)],
  ['CSS badge is absolute', /\.vt-captioned-image__badge[\s\S]*\{[\s\S]*position:\s*absolute/.test(css)],
  ['CSS badge nowrap', css.includes('white-space: nowrap')],
  ['CSS badge horizontal writing mode', css.includes('writing-mode: horizontal-tb')],
  ['CSS badge keep-all', css.includes('word-break: keep-all')],
  ['CSS help is absolute', /\.vt-captioned-image__help[\s\S]*\{[\s\S]*position:\s*absolute/.test(css)],
  ['CSS tooltip is frame overlay', /\.vt-captioned-image__tooltip\s*\{[\s\S]*position:\s*absolute/.test(css) && css.includes('bottom: 0.75rem')],
  ['image displays block', /\.vt-captioned-image__image\s*\{[\s\S]*display:\s*block/.test(css)],
  ['mini gallery anchor prefers figure.vt-captioned-image', sectionLightbox.includes("image.closest<HTMLElement>('figure.vt-captioned-image')")],
  ['Visual QA contains Captioned Image Frame Contract', qa.includes('Captioned Image Frame Contract')],
  ['Visual QA documents strict tooltip trigger', qa.includes('? help button') || qa.includes('help button')],
  ['Visual QA contains Required Badge', qa.includes('Required Badge')],
  ['Visual QA contains Optional Badge', qa.includes('Optional Badge')],
  ['Visual QA contains Misc Badge', qa.includes('Misc Badge')],
]

for (const [name, pattern] of forbiddenSourcePatterns) {
  checks.push([`Forbidden source removed: ${name}`, !vue.includes(pattern)])
}

for (const [name, pattern] of forbiddenCssPatterns) {
  checks.push([`Forbidden CSS removed: ${name}`, !css.includes(pattern)])
}

const failed = checks.filter(([, ok]) => !ok)
if (failed.length) {
  for (const [name] of failed) console.error(`[captioned-image] missing: ${name}`)
  process.exit(1)
}

console.log(`[captioned-image] OK — ${checks.length} checks`)
