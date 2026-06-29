#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const PATCH_ID = 'PUBLIC-ASSET-SSOT-04M-U1'
const ROOT = process.cwd()

function read(rel) {
  const full = path.join(ROOT, rel)
  if (!fs.existsSync(full)) throw new Error(`${PATCH_ID}: missing file ${rel}`)
  return fs.readFileSync(full, 'utf8')
}

function write(rel, text) {
  const full = path.join(ROOT, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, text, 'utf8')
  console.log(`${PATCH_ID}: wrote ${rel}`)
}

function replaceMarkedBlock(text, marker, block) {
  const start = `/* ${marker} START */`
  const end = `/* ${marker} END */`
  const pattern = new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}\\n?`, 'g')
  const next = `${start}\n${block.trim()}\n${end}\n`
  if (pattern.test(text)) return text.replace(pattern, next)
  return `${text.replace(/\s+$/, '')}\n\n${next}`
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function patchMarkdownToc() {
  const rel = 'src/styles/markdown-toc.css'
  let text = read(rel)
  const block = `
@media (max-width: 980px) {
  .vt-toc {
    position: fixed;
    top: max(4.75rem, calc(env(safe-area-inset-top) + 0.85rem));
    left: max(0.85rem, env(safe-area-inset-left));
    right: auto;
    bottom: auto;
    width: auto;
    z-index: 80;
  }

  .vt-toc__panel {
    position: absolute;
    top: calc(100% + 0.65rem);
    left: 0;
    right: auto;
    bottom: auto;
    width: min(320px, calc(100vw - 2rem));
    max-height: min(520px, calc(100vh - 7rem));
  }
}

@media (max-width: 420px) {
  .vt-toc {
    top: max(4.35rem, calc(env(safe-area-inset-top) + 0.72rem));
    left: max(0.72rem, env(safe-area-inset-left));
  }

  .vt-toc__panel {
    width: min(300px, calc(100vw - 1.5rem));
    max-height: min(480px, calc(100vh - 6.5rem));
  }
}
`
  text = replaceMarkedBlock(text, `${PATCH_ID} MOBILE TOC RELOCATION`, block)
  write(rel, text)
}

function patchMarkdownGutter() {
  const rel = 'src/styles/markdown.css'
  let text = read(rel)
  const block = `
@media (max-width: 900px) {
  :root {
    --vt-mobile-page-gutter: clamp(22px, 6vw, 32px);
    --vt-page-padding-x: 24px;
  }

  .vt-markdown-page {
    padding-inline: var(--vt-mobile-page-gutter);
  }
}

@media (max-width: 420px) {
  :root {
    --vt-mobile-page-gutter: clamp(20px, 6.2vw, 28px);
  }
}
`
  text = replaceMarkedBlock(text, `${PATCH_ID} MOBILE GUTTER`, block)
  write(rel, text)
}

function patchSiteNavigationGutter() {
  const rel = 'src/styles/site-navigation.css'
  let text = read(rel)
  const block = `
@media (max-width: 560px) {
  .vt-site-header,
  .vt-site-footer {
    width: min(calc(100% - (var(--vt-mobile-page-gutter, 24px) * 2)), 1120px);
  }
}
`
  text = replaceMarkedBlock(text, `${PATCH_ID} SITE GUTTER ALIGN`, block)
  write(rel, text)
}

function patchHomeReservationsCss() {
  const rel = 'src/styles/markdown-works.css'
  let text = read(rel)
  const block = `
:root {
  --vt-home-recent-min-height: clamp(360px, 92vw, 680px);
  --vt-home-featured-min-height: clamp(420px, 100vw, 760px);
}

.vt-home-late-container {
  width: min(1120px, calc(100% - (var(--vt-mobile-page-gutter, 24px) * 2)));
  margin-inline: auto;
}

.vt-home-late-container--recent,
.vt-home-recent-public-content {
  min-height: var(--vt-home-recent-min-height);
  contain-intrinsic-size: var(--vt-home-recent-min-height);
}

.vt-home-late-container--featured,
.vt-home-featured-works {
  min-height: var(--vt-home-featured-min-height);
  contain-intrinsic-size: var(--vt-home-featured-min-height);
}

.vt-home-recent-public-content,
.vt-home-featured-works {
  content-visibility: auto;
}

@media (max-width: 720px) {
  .vt-home-featured-works,
  .vt-home-recent-public-content {
    width: min(calc(100% - (var(--vt-mobile-page-gutter, 24px) * 2)), 1120px);
  }
}

@media (max-width: 420px) {
  :root {
    --vt-home-recent-min-height: 420px;
    --vt-home-featured-min-height: 520px;
  }
}
`
  text = replaceMarkedBlock(text, `${PATCH_ID} LATE CONTAINER RESERVE`, block)
  write(rel, text)
}

function patchHomeRecentScopedWidth() {
  const rel = 'src/components/home/HomeRecentPublicContent.vue'
  const full = path.join(ROOT, rel)
  if (!fs.existsSync(full)) {
    console.log(`${PATCH_ID}: skip optional ${rel}`)
    return
  }
  let text = read(rel)
  const before = `width: min(1120px, calc(100% - 2rem));`
  const after = `width: min(1120px, calc(100% - (var(--vt-mobile-page-gutter, 24px) * 2)));`
  if (text.includes(before)) text = text.replace(before, after)
  write(rel, text)
}

function patchHomePageWrappers() {
  const rel = 'src/pages/HomePage.vue'
  const full = path.join(ROOT, rel)
  if (!fs.existsSync(full)) {
    console.log(`${PATCH_ID}: skip optional ${rel}`)
    return
  }
  let text = read(rel)
  if (!text.includes('vt-home-late-container--recent')) {
    text = text.replace(
      /\n\s*<HomeRecentPublicContent\s*\/>(?=\n)/,
      `\n  <div\n    class="vt-home-late-container vt-home-late-container--recent"\n    data-vacms-late-container="recent"\n  >\n    <HomeRecentPublicContent />\n  </div>`,
    )
  }
  if (!text.includes('vt-home-late-container--featured')) {
    text = text.replace(
      /\n\s*<HomeFeaturedWorks\s*\/>(?=\n)/,
      `\n  <div\n    class="vt-home-late-container vt-home-late-container--featured"\n    data-vacms-late-container="featured"\n  >\n    <HomeFeaturedWorks />\n  </div>`,
    )
  }
  write(rel, text)
}

patchMarkdownToc()
patchMarkdownGutter()
patchSiteNavigationGutter()
patchHomeReservationsCss()
patchHomeRecentScopedWidth()
patchHomePageWrappers()

console.log('PASS_PUBLIC_ASSET_SSOT_04M_U1_APPLY_MOBILE_TOC_GUTTER_RESERVE')
