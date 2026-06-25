#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { renderStaticArticleHtml } from './render-static-article-html.mjs'

const PASS_STATUS = 'PASS_CMS_207D_STATIC_ARTICLE_PRERENDER'
const fixtureDir = path.join('tmp', 'cms207d')
const fixture = path.join(fixtureDir, 'index.md')

fs.mkdirSync(fixtureDir, { recursive: true })
fs.writeFileSync(fixture, `---\ntitle: "CMS 207D 테스트"\ncategory: "post"\nslug: "cms207d-fixture"\nsummary: "정적 HTML 프리렌더 테스트"\n---\n\n본문입니다.\n\n::note\n노트 본문\n::\n\n::markdown-box\n박스 본문\n::\n`, 'utf8')

const result = renderStaticArticleHtml(fixture)
if (!result.ok) throw new Error('render result is not ok')
if (!result.html.includes('data-vacms-static-article="true"')) throw new Error('static article marker missing')
if (!result.html.includes('CMS 207D 테스트')) throw new Error('title missing')
if (!result.html.includes('본문입니다.')) throw new Error('body missing')
if (!result.html.includes('markdown-callout-note')) throw new Error('note directive was not rendered')
if (!result.html.includes('markdown-box')) throw new Error('markdown-box directive was not rendered')
if (result.diagnostics.rawDirectiveLeakCount !== 0) throw new Error('raw directive leaked')

console.log(PASS_STATUS)
