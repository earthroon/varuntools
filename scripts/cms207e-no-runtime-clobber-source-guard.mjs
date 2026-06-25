#!/usr/bin/env node
import fs from 'node:fs'
import process from 'node:process'

const PASS_STATUS = 'PASS_CMS_207E_NO_RUNTIME_CLOBBER_SOURCE_GUARD'
const MAIN_FILE = 'src/main.ts'

function fail(code, message) {
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
  if (!fs.existsSync(MAIN_FILE)) fail('CMS_207E_MAIN_TS_MISSING', `${MAIN_FILE} is missing`)
  const source = stripComments(fs.readFileSync(MAIN_FILE, 'utf8'))

  if (source.includes('hasStaticArticlePrerender') || source.includes('vacms-static-article-prerender')) {
    fail('CMS_207E_STATIC_PRERENDER_RUNTIME_LOCK_BLOCKED', 'static prerender must not lock runtime mount after CMS-207M')
  }
  const mountCount = (source.match(/createApp\(App\)\.use\(router\)\.mount\(root\)/g) || []).length
  if (mountCount !== 1) fail('CMS_207E_MOUNT_COUNT_INVALID', `expected exactly one root Vue mount, got ${mountCount}`)

  console.log(PASS_STATUS)
}

try {
  main()
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
