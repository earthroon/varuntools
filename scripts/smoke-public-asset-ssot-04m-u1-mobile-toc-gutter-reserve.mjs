#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const PATCH_ID = 'PUBLIC-ASSET-SSOT-04M-U1'
const ROOT = process.cwd()
const PASS = 'PASS_PUBLIC_ASSET_SSOT_04M_U1_MOBILE_TOC_GUTTER_RESERVE'

function read(rel) {
  const full = path.join(ROOT, rel)
  if (!fs.existsSync(full)) throw new Error(`${PATCH_ID}: missing ${rel}`)
  return fs.readFileSync(full, 'utf8')
}

function assertIncludes(text, token, rel) {
  if (!text.includes(token)) throw new Error(`${PATCH_ID}: ${rel} missing token ${token}`)
}

function assertNotIncludes(text, token, rel) {
  if (text.includes(token)) throw new Error(`${PATCH_ID}: ${rel} forbidden token ${token}`)
}

const toc = read('src/styles/markdown-toc.css')
assertIncludes(toc, `${PATCH_ID} MOBILE TOC RELOCATION START`, 'src/styles/markdown-toc.css')
assertIncludes(toc, 'top: max(4.75rem', 'src/styles/markdown-toc.css')
assertIncludes(toc, 'left: max(0.85rem', 'src/styles/markdown-toc.css')
assertIncludes(toc, 'right: auto;', 'src/styles/markdown-toc.css')
assertIncludes(toc, 'bottom: auto;', 'src/styles/markdown-toc.css')
assertIncludes(toc, 'top: calc(100% + 0.65rem);', 'src/styles/markdown-toc.css')
assertIncludes(toc, 'left: 0;', 'src/styles/markdown-toc.css')

const markdown = read('src/styles/markdown.css')
assertIncludes(markdown, `${PATCH_ID} MOBILE GUTTER START`, 'src/styles/markdown.css')
assertIncludes(markdown, '--vt-mobile-page-gutter', 'src/styles/markdown.css')
assertIncludes(markdown, 'padding-inline: var(--vt-mobile-page-gutter)', 'src/styles/markdown.css')

const nav = read('src/styles/site-navigation.css')
assertIncludes(nav, `${PATCH_ID} SITE GUTTER ALIGN START`, 'src/styles/site-navigation.css')
assertIncludes(nav, 'var(--vt-mobile-page-gutter, 24px)', 'src/styles/site-navigation.css')

const works = read('src/styles/markdown-works.css')
assertIncludes(works, `${PATCH_ID} LATE CONTAINER RESERVE START`, 'src/styles/markdown-works.css')
assertIncludes(works, '--vt-home-recent-min-height', 'src/styles/markdown-works.css')
assertIncludes(works, '--vt-home-featured-min-height', 'src/styles/markdown-works.css')
assertIncludes(works, '.vt-home-late-container--recent', 'src/styles/markdown-works.css')
assertIncludes(works, '.vt-home-late-container--featured', 'src/styles/markdown-works.css')
assertIncludes(works, 'min-height: var(--vt-home-recent-min-height)', 'src/styles/markdown-works.css')
assertIncludes(works, 'min-height: var(--vt-home-featured-min-height)', 'src/styles/markdown-works.css')
assertIncludes(works, 'contain-intrinsic-size', 'src/styles/markdown-works.css')
assertIncludes(works, 'content-visibility: auto', 'src/styles/markdown-works.css')

const commandPaletteCss = read('src/styles/command-palette.css')
assertIncludes(commandPaletteCss, '.vt-command-trigger', 'src/styles/command-palette.css')
assertIncludes(commandPaletteCss, 'right:', 'src/styles/command-palette.css')
assertIncludes(commandPaletteCss, 'bottom:', 'src/styles/command-palette.css')

const homePagePath = path.join(ROOT, 'src/pages/HomePage.vue')
if (fs.existsSync(homePagePath)) {
  const homePage = read('src/pages/HomePage.vue')
  assertIncludes(homePage, 'vt-home-late-container--recent', 'src/pages/HomePage.vue')
  assertIncludes(homePage, 'vt-home-late-container--featured', 'src/pages/HomePage.vue')
  assertIncludes(homePage, 'data-vacms-late-container="recent"', 'src/pages/HomePage.vue')
  assertIncludes(homePage, 'data-vacms-late-container="featured"', 'src/pages/HomePage.vue')
}

const recentPath = path.join(ROOT, 'src/components/home/HomeRecentPublicContent.vue')
if (fs.existsSync(recentPath)) {
  const recent = read('src/components/home/HomeRecentPublicContent.vue')
  assertNotIncludes(recent, 'width: min(1120px, calc(100% - 2rem));', 'src/components/home/HomeRecentPublicContent.vue')
}

console.log(PASS)
