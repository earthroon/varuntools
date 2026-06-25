#!/usr/bin/env node
import fs from 'node:fs'
import process from 'node:process'

const PATCH_ID = 'CMS-207M'
const PASS_STATUS = 'PASS_CMS_207M_NO_RAW_STATIC_MARKDOWN_FREEZE'
const MAIN_FILE = 'src/main.ts'
const MATERIALIZER_FILE = 'scripts/materialize-static-routes.mjs'
const STATIC_RENDERER_FILE = 'scripts/render-static-article-html.mjs'

function fail(code, message, extra = {}) {
  const receipt = {
    ok: false,
    patchId: PATCH_ID,
    status: 'FAIL_' + PASS_STATUS,
    blockedReasonCode: code,
    blockedReason: message,
    ...extra,
    generatedAt: new Date().toISOString(),
  }
  fs.writeFileSync('cms207m-no-raw-static-markdown-freeze-receipt.json', JSON.stringify(receipt, null, 2) + '\n', 'utf8')
  const error = new Error(message)
  error.code = code
  throw error
}

function read(file) {
  if (!fs.existsSync(file)) fail('CMS_207M_REQUIRED_FILE_MISSING', `${file} is missing`, { file })
  return fs.readFileSync(file, 'utf8')
}

function main() {
  const mainSource = read(MAIN_FILE)
  const materializer = read(MATERIALIZER_FILE)
  const renderer = read(STATIC_RENDERER_FILE)

  if (mainSource.includes('hasStaticArticlePrerender') || mainSource.includes('if (!hasStaticArticlePrerender)')) {
    fail('CMS_207M_WORKS_ROUTE_STATIC_LOCK_DETECTED', `${MAIN_FILE} still contains static article mount lock`)
  }
  if (!mainSource.includes('createApp(App).use(router).mount(root)')) {
    fail('CMS_207M_RAW_STATIC_FREEZE_CONTRACT_BROKEN', `${MAIN_FILE} does not mount client app on root`)
  }
  if (!materializer.includes('data-vacms-static-prerender="true"') && !renderer.includes('data-vacms-static-prerender="true"')) {
    fail('CMS_207M_STATIC_FALLBACK_MARKER_MISSING', 'static fallback marker is missing from materializer/renderer')
  }
  if (!materializer.includes('renderStaticArticleHtml') || !renderer.includes('renderMarkdownBody')) {
    fail('CMS_207M_STATIC_RENDERER_CONTRACT_MISSING', 'static route materializer/renderer contract is missing')
  }

  if (fs.existsSync('dist/works/index.html')) {
    const worksHtml = fs.readFileSync('dist/works/index.html', 'utf8')
    if (!/<script\s+type=["']module["'][^>]+src=["']\/assets\//.test(worksHtml)) {
      fail('CMS_207M_STATIC_ROUTE_WITHOUT_CLIENT_ENTRY', 'dist/works/index.html does not include client module script')
    }
  }

  const receipt = {
    ok: true,
    patchId: PATCH_ID,
    status: PASS_STATUS,
    staticFallbackAllowed: true,
    staticFallbackRuntimeOwner: false,
    clientRuntimeOwner: true,
    generatedAt: new Date().toISOString(),
  }
  fs.writeFileSync('cms207m-no-raw-static-markdown-freeze-receipt.json', JSON.stringify(receipt, null, 2) + '\n', 'utf8')
  console.log(PASS_STATUS)
}

try {
  main()
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
