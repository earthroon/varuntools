#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const vuePath = path.join(root, 'src/components/markdown/MarkdownLightbox.vue')
const cssPath = path.join(root, 'src/styles/markdown-lightbox.css')
const pkgPath = path.join(root, 'package.json')
const checkPath = path.join(root, 'scripts/check-launch.mjs')

const vue = fs.readFileSync(vuePath, 'utf8')
const css = fs.readFileSync(cssPath, 'utf8')
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
const check = fs.readFileSync(checkPath, 'utf8')

const checks = []
function ok(name, pass) {
  checks.push({ name, pass })
}

ok('MarkdownLightbox.vue has vt-lightbox__control-icon', vue.includes('vt-lightbox__control-icon'))
ok('close button contains control icon span', /class="vt-lightbox__close"[\s\S]*?<span class="vt-lightbox__control-icon"[^>]*>×<\/span>/.test(vue))
ok('prev button contains control icon span', /class="vt-lightbox__nav is-prev"[\s\S]*?<span class="vt-lightbox__control-icon"[^>]*>‹<\/span>/.test(vue))
ok('next button contains control icon span', /class="vt-lightbox__nav is-next"[\s\S]*?<span class="vt-lightbox__control-icon"[^>]*>›<\/span>/.test(vue))
ok('close button has aria-label', /class="vt-lightbox__close"[\s\S]*?aria-label="확대 이미지 닫기"/.test(vue))
ok('prev button has aria-label', /class="vt-lightbox__nav is-prev"[\s\S]*?aria-label="이전 이미지"/.test(vue))
ok('next button has aria-label', /class="vt-lightbox__nav is-next"[\s\S]*?aria-label="다음 이미지"/.test(vue))
ok('Open action wraps text with span', /class="vt-lightbox__action"[\s\S]*?>\s*<span>Open<\/span>\s*<\/a>/.test(vue))
ok('Info action wraps text with span', /<span>Info<\/span>/.test(vue))
ok('Copy action wraps text with span', /<span>Copy<\/span>/.test(vue))
ok('zoom buttons wrap text with span', /<span>\+<\/span>/.test(vue) && /<span>−<\/span>/.test(vue) && /<span>1×<\/span>/.test(vue))

ok('CSS sets close/nav display inline-grid', /\.vt-lightbox__close,\s*\n\.vt-lightbox__nav\s*{[\s\S]*?display:\s*inline-grid/.test(css))
ok('CSS sets close/nav place-items center', /\.vt-lightbox__close,\s*\n\.vt-lightbox__nav\s*{[\s\S]*?place-items:\s*center/.test(css))
ok('CSS sets close/nav color', /\.vt-lightbox__close,\s*\n\.vt-lightbox__nav\s*{[\s\S]*?color:\s*rgba\(22, 24, 29, 0\.96\)/.test(css))
ok('CSS sets close/nav line-height 1', /\.vt-lightbox__close,\s*\n\.vt-lightbox__nav\s*{[\s\S]*?line-height:\s*1/.test(css))
ok('CSS sets control icon currentColor', /\.vt-lightbox__control-icon\s*{[\s\S]*?color:\s*currentColor/.test(css))
ok('CSS sets close z-index', /\.vt-lightbox__close\s*{[\s\S]*?z-index:\s*40/.test(css))
ok('CSS sets nav z-index', /\.vt-lightbox__nav\s*{[\s\S]*?z-index:\s*38/.test(css))
ok('CSS sets action display inline-flex', /\.vt-lightbox__action\s*{[\s\S]*?display:\s*inline-flex/.test(css))
ok('CSS sets action align-items center', /\.vt-lightbox__action\s*{[\s\S]*?align-items:\s*center/.test(css))
ok('CSS sets action justify-content center', /\.vt-lightbox__action\s*{[\s\S]*?justify-content:\s*center/.test(css))
ok('CSS sets a.vt-lightbox__action alignment', /a\.vt-lightbox__action\s*{[\s\S]*?display:\s*inline-flex[\s\S]*?align-items:\s*center[\s\S]*?justify-content:\s*center/.test(css))
ok('CSS sets action text line-height 1', /\.vt-lightbox__action\s*{[\s\S]*?line-height:\s*1/.test(css))
ok('CSS sets touch target for mobile action/zoom', /@media \(max-width:\s*719px\)[\s\S]*?\.vt-lightbox__action,\s*\n\s*\.vt-lightbox__zoom-button\s*{[\s\S]*?min-width:\s*var\(--vt-touch-target, 44px\)/.test(css))
ok('package has smoke:lightbox-controls', pkg.scripts?.['smoke:lightbox-controls'] === 'node scripts/smoke-lightbox-controls.mjs')
ok('check-launch includes smoke:lightbox-controls', check.includes('smoke-lightbox-controls.mjs'))

const failed = checks.filter((item) => !item.pass)
if (failed.length) {
  console.error('smoke:lightbox-controls FAILED')
  for (const item of failed) console.error(`- ${item.name}`)
  process.exit(1)
}

console.log(`smoke:lightbox-controls OK — ${checks.length} checks`)
