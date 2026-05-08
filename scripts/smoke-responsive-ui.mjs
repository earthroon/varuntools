#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const responsive = read('src/styles/responsive.css')
const main = read('src/main.ts')
const qa = read('src/content/pages/lab-markdown-gallery/index.md')
const pkg = JSON.parse(read('package.json'))

const checks = [
  ['responsive.css exists', fs.existsSync(path.join(root, 'src/styles/responsive.css'))],
  ['responsive import exists', main.includes("./styles/responsive.css")],
  ['content max token', responsive.includes('--vt-content-max')],
  ['content wide max token', responsive.includes('--vt-content-wide-max')],
  ['media max token', responsive.includes('--vt-media-max')],
  ['page pad token', responsive.includes('--vt-page-pad')],
  ['touch target token', responsive.includes('--vt-touch-target')],
  ['1023 breakpoint', responsive.includes('@media (max-width: 1023px)')],
  ['719 breakpoint', responsive.includes('@media (max-width: 719px)')],
  ['420 breakpoint', responsive.includes('@media (max-width: 420px)')],
  ['hoverless media query', responsive.includes('@media (hover: none)') || responsive.includes('(hover: none)')],
  ['pointer coarse media query', responsive.includes('(pointer: coarse)')],
  ['lightbox mobile stage max-height', responsive.includes('.vt-lightbox__stage') && responsive.includes('58vh')],
  ['desktop lightbox density clamp', responsive.includes('1080px') && responsive.includes('760px')],
  ['lightbox meta mobile max-height', responsive.includes('.vt-lightbox__meta') && responsive.includes('22vh')],
  ['lightbox thumbs mobile pan-x', responsive.includes('.vt-lightbox__thumbs') && responsive.includes('touch-action: pan-x')],
  ['magnifier disabled on touch/mobile', responsive.includes('.vt-image-magnifier') && responsive.includes('display: none !important')],
  ['captioned image mobile badge rule', responsive.includes('.vt-captioned-image__badge') && responsive.includes('0.68rem')],
  ['gallery strip mobile rule', responsive.includes('.vt-gallery-strip') && responsive.includes('repeat(2, minmax(0, 1fr))')],
  ['before-after mobile handle', responsive.includes('.vt-before-after__handle') && responsive.includes('2.6rem')],
  ['video player mobile max-height', responsive.includes('.vt-video-player__video') && responsive.includes('56vh')],
  ['pagecard responsive grid', responsive.includes('.vt-pagecard-grid') && responsive.includes('grid-template-columns: 1fr')],
  ['markdown table overflow handled', responsive.includes('.vt-markdown table') && responsive.includes('overflow-x: auto')],
  ['Visual QA responsive contract', qa.includes('Responsive UI Contract')],
  ['Visual QA wide density contract', qa.includes('와이드 화면에서도 본문 타이포그래피')],
  ['h1 wide clamp is bounded', responsive.includes('font-size: clamp(2.05rem, 3vw, 3.05rem)')],
  ['h1 billboard clamp removed', !responsive.includes('clamp(2rem, 6vw, 4.2rem)')],
  ['grouped page/content width selector removed', !responsive.includes(`.vt-markdown,
.vt-markdown-page`) && !responsive.includes(`.vt-markdown,
.vt-markdown-page`)],
  ['content rail uses content max', responsive.includes('.vt-markdown {') && responsive.includes('var(--vt-content-max)')],
  ['page shell owns outer padding', responsive.includes('.vt-markdown-page,') && responsive.includes('padding-inline: var(--vt-page-pad)')],
  ['package script exists', pkg.scripts?.['smoke:responsive-ui'] === 'node scripts/smoke-responsive-ui.mjs'],
]

const failed = checks.filter(([, ok]) => !ok)
if (failed.length) {
  for (const [name] of failed) console.error(`[responsive-ui] missing: ${name}`)
  process.exit(1)
}

console.log(`[responsive-ui] OK — ${checks.length} checks`)
