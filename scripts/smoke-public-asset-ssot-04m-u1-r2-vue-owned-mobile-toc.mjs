#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const PATCH_ID = 'PUBLIC-ASSET-SSOT-04M-U1-R2'
const PASS = 'PASS_PUBLIC_ASSET_SSOT_04M_U1_R2_VUE_OWNED_MOBILE_TOC'
const root = process.cwd()

function read(rel) {
  const full = path.join(root, rel)
  if (!fs.existsSync(full)) throw new Error(`${PATCH_ID}: missing ${rel}`)
  return fs.readFileSync(full, 'utf8')
}

function assertIncludes(text, token, rel) {
  if (!text.includes(token)) throw new Error(`${PATCH_ID}: ${rel} missing ${token}`)
}

function assertNotIncludes(text, token, rel) {
  if (text.includes(token)) throw new Error(`${PATCH_ID}: ${rel} must not include ${token}`)
}

const tocPath = 'src/components/markdown/MarkdownToc.vue'
const toc = read(tocPath)

assertIncludes(toc, 'isMobileViewport', tocPath)
assertIncludes(toc, 'isScrollIdle', tocPath)
assertIncludes(toc, 'isScrollHidden', tocPath)
assertIncludes(toc, 'tocRootStyle', tocPath)
assertIncludes(toc, 'tocPanelStyle', tocPath)
assertIncludes(toc, 'tocToggleStyle', tocPath)
assertIncludes(toc, 'readHeaderDockMetrics', tocPath)
assertIncludes(toc, "document.querySelector<HTMLElement>('.vt-site-header')", tocPath)
assertIncludes(toc, "window.addEventListener('scroll', handleScroll, { passive: true })", tocPath)
assertIncludes(toc, "window.removeEventListener('scroll', handleScroll)", tocPath)
assertIncludes(toc, 'clearScrollIdleTimer()', tocPath)
assertIncludes(toc, 'data-vacms-toc-dock', tocPath)
assertIncludes(toc, 'vue-owned-header-zone', tocPath)
assertIncludes(toc, 'data-vacms-toc-scroll-state', tocPath)
assertIncludes(toc, "top: `${metrics.top}px`", tocPath)
assertIncludes(toc, "right: `${metrics.right}px`", tocPath)
assertIncludes(toc, "bottom: 'auto'", tocPath)
assertIncludes(toc, "left: 'auto'", tocPath)
assertIncludes(toc, "opacity: hidden ? '0' : '1'", tocPath)
assertIncludes(toc, "pointerEvents: hidden ? 'none' : 'auto'", tocPath)
assertNotIncludes(toc, 'Teleport', tocPath)

const recentPath = 'src/components/home/HomeRecentPublicContent.vue'
const recent = read(recentPath)
assertIncludes(recent, 'data-vacms-late-container-reserve="true"', recentPath)
assertIncludes(recent, 'min-height: clamp(260px, 42vh, 520px)', recentPath)
assertIncludes(recent, 'content-visibility: auto', recentPath)
assertIncludes(recent, 'contain-intrinsic-size: 420px', recentPath)
assertIncludes(recent, 'contain-intrinsic-size: 520px', recentPath)

const worksPath = 'src/styles/markdown-works.css'
const works = read(worksPath)
assertIncludes(works, 'PUBLIC-ASSET-SSOT-04M-U1-R2 late container reserve:start', worksPath)
assertIncludes(works, '.vt-home-featured-works', worksPath)
assertIncludes(works, 'min-height: clamp(260px, 42vh, 520px)', worksPath)
assertIncludes(works, 'content-visibility: auto', worksPath)
assertIncludes(works, 'contain-intrinsic-size: 420px', worksPath)
assertIncludes(works, 'contain-intrinsic-size: 520px', worksPath)

console.log(PASS)
