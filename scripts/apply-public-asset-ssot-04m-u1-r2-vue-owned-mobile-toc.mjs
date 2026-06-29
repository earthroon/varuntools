#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const PATCH_ID = 'PUBLIC-ASSET-SSOT-04M-U1-R2'
const PASS = 'PASS_PUBLIC_ASSET_SSOT_04M_U1_R2_APPLY_VUE_OWNED_MOBILE_TOC'
const root = process.cwd()

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8')
}

function write(rel, text) {
  fs.writeFileSync(path.join(root, rel), text, 'utf8')
}

function replaceBlock(text, start, end, next) {
  const pattern = new RegExp(`${start}[\\s\\S]*?${end}\\n?`, 'm')
  const block = `${start}\n${next.trim()}\n${end}\n`
  if (pattern.test(text)) return text.replace(pattern, block)
  return `${text.trimEnd()}\n\n${block}`
}

function assertIncludes(text, token, rel) {
  if (!text.includes(token)) throw new Error(`${PATCH_ID}: ${rel} missing ${token}`)
}

const tocPath = 'src/components/markdown/MarkdownToc.vue'
const toc = read(tocPath)
assertIncludes(toc, 'tocRootStyle', tocPath)
assertIncludes(toc, 'tocPanelStyle', tocPath)
assertIncludes(toc, 'tocToggleStyle', tocPath)
assertIncludes(toc, 'readHeaderDockMetrics', tocPath)
assertIncludes(toc, 'isScrollIdle', tocPath)
assertIncludes(toc, "window.addEventListener('scroll', handleScroll, { passive: true })", tocPath)

const worksPath = 'src/styles/markdown-works.css'
let works = read(worksPath)
works = replaceBlock(
  works,
  '/\\* PUBLIC-ASSET-SSOT-04M-U1-R2 late container reserve:start \\*/',
  '/\\* PUBLIC-ASSET-SSOT-04M-U1-R2 late container reserve:end \\*/',
  `/* Home sections can enter after critical render. Reserve visual space to reduce CLS. */
.vt-home-featured-works {
  min-height: clamp(260px, 42vh, 520px);
  content-visibility: auto;
  contain-intrinsic-size: 420px;
}

@media (max-width: 720px) {
  .vt-home-featured-works {
    min-height: clamp(300px, 58vh, 560px);
    contain-intrinsic-size: 520px;
  }
}`,
)
write(worksPath, works)

const recentPath = 'src/components/home/HomeRecentPublicContent.vue'
const recent = read(recentPath)
assertIncludes(recent, 'data-vacms-late-container-reserve="true"', recentPath)
assertIncludes(recent, 'contain-intrinsic-size', recentPath)
assertIncludes(recent, 'min-height', recentPath)

console.log(PASS)
