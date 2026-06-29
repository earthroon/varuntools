#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const PATCH_ID = 'PUBLIC-ASSET-SSOT-04M-H1'
const PASS = 'PASS_PUBLIC_ASSET_SSOT_04M_H1_HOME_SECTION_PRUNE'
const root = process.cwd()
const homePath = path.join(root, 'src', 'content', 'pages', 'home', 'index.md')

function fail(message) {
  console.error(`[${PATCH_ID}] FAIL ${message}`)
  process.exit(1)
}

function assertIncludes(text, needle, label) {
  if (!text.includes(needle)) fail(`missing ${label}: ${needle}`)
}

function assertExcludes(text, needle, label) {
  if (text.includes(needle)) fail(`unexpected ${label}: ${needle}`)
}

if (!fs.existsSync(homePath)) fail(`missing home markdown: ${homePath}`)
const text = fs.readFileSync(homePath, 'utf8').replace(/^\uFEFF/, '')

assertIncludes(text, 'title: 바룬툴즈 안내', 'new markdown-box title')
assertIncludes(text, '디자인작업, 자동화 도구 등을 한 곳에 묶은 개인 작업실형 홈페이지입니다.', 'new guide copy')
assertExcludes(text, 'title: 작업실 안내', 'old markdown-box title')
assertExcludes(text, 'title: 추천 상품', 'removed product section title')
assertExcludes(text, 'source: products', 'removed product source')
assertExcludes(text, 'title: 대표 작업', 'removed works section title')
assertExcludes(text, 'source: works', 'removed works source')
assertIncludes(text, 'title: 도구', 'tools section')
assertIncludes(text, 'source: tools', 'tools source')
assertIncludes(text, 'title: 실험실', 'lab section')
assertIncludes(text, 'source: lab', 'lab source')
assertIncludes(text, 'title: 최근 글', 'post section')
assertIncludes(text, 'source: post', 'post source')

console.log(PASS)
