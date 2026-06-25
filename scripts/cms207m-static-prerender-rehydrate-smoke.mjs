#!/usr/bin/env node
import fs from 'node:fs'
import process from 'node:process'

const PATCH_ID = 'CMS-207M'
const PASS_STATUS = 'PASS_CMS_207M_STATIC_PRERENDER_REHYDRATE'
const MAIN_FILE = 'src/main.ts'

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
  fs.writeFileSync('cms207m-static-prerender-rehydrate-receipt.json', JSON.stringify(receipt, null, 2) + '\n', 'utf8')
  const error = new Error(message)
  error.code = code
  throw error
}

function stripComments(source) {
  return String(source || '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|\s)\/\/.*$/gm, '')
}

function main() {
  if (!fs.existsSync(MAIN_FILE)) fail('CMS_207M_MAIN_TS_MISSING', `${MAIN_FILE} is missing`)
  const raw = fs.readFileSync(MAIN_FILE, 'utf8')
  const source = stripComments(raw)

  const forbidden = [
    ['CMS_207M_STATIC_PRERENDER_MOUNT_SKIP_REMAINS', 'hasStaticArticlePrerender'],
    ['CMS_207M_STATIC_PRERENDER_IF_SKIP_REMAINS', 'if (!hasStaticArticlePrerender)'],
    ['CMS_207M_STATIC_ARTICLE_META_LOCK_REMAINS', 'vacms-static-article-prerender'],
    ['CMS_207M_STATIC_ARTICLE_DATA_LOCK_REMAINS', 'data-vacms-static-article'],
  ]
  for (const [code, token] of forbidden) {
    if (source.includes(token)) fail(code, `${MAIN_FILE} still contains static prerender runtime lock token: ${token}`)
  }

  if (!/const\s+root\s*=\s*document\.querySelector\(['"]#app['"]\)/.test(source)) {
    fail('CMS_207M_ROOT_MOUNT_GUARD_MISSING', `${MAIN_FILE} must bind #app root before mounting`)
  }
  if (!/if\s*\(\s*root\s*\)\s*\{[\s\S]*createApp\(App\)\.use\(router\)\.mount\(root\)[\s\S]*\}/m.test(source)) {
    fail('CMS_207M_CLIENT_MOUNT_MISSING', `${MAIN_FILE} must mount Vue app on root regardless of static prerender markers`)
  }

  const mountCount = (source.match(/createApp\(App\)\.use\(router\)\.mount\(/g) || []).length
  if (mountCount !== 1) fail('CMS_207M_MOUNT_COUNT_INVALID', `expected exactly one Vue mount call, got ${mountCount}`)

  const receipt = {
    ok: true,
    patchId: PATCH_ID,
    status: PASS_STATUS,
    mainFile: MAIN_FILE,
    clientMountAlwaysEnabled: true,
    staticPrerenderRuntimeLock: false,
    generatedAt: new Date().toISOString(),
  }
  fs.writeFileSync('cms207m-static-prerender-rehydrate-receipt.json', JSON.stringify(receipt, null, 2) + '\n', 'utf8')
  console.log(PASS_STATUS)
}

try {
  main()
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
