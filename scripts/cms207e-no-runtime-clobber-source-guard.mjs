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
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|\s)\/\/.*$/gm, '')
}

function main() {
  if (!fs.existsSync(MAIN_FILE)) fail('CMS_207E_MAIN_TS_MISSING', `${MAIN_FILE} is missing`)
  const source = stripComments(fs.readFileSync(MAIN_FILE, 'utf8'))

  const unconditionalMount = /(?:^|\n)\s*createApp\(App\)\.use\(router\)\.mount\(['"]#app['"]\)\s*$/m
  if (unconditionalMount.test(source)) {
    fail('CMS_207E_UNCONDITIONAL_MOUNT_BLOCKED', 'unconditional createApp(...).mount(#app) is blocked')
  }

  const hasMeta = source.includes('vacms-static-article-prerender')
  const hasRoot = source.includes('data-vacms-static-prerender')
  const hasArticle = source.includes('data-vacms-static-article')
  const hasGuard = source.includes('hasStaticArticlePrerender')
  if (!hasMeta || !hasRoot || !hasArticle || !hasGuard) {
    fail('CMS_207E_STATIC_PRERENDER_GUARD_INCOMPLETE', 'static prerender guard is incomplete')
  }

  const mountCount = (source.match(/createApp\(App\)\.use\(router\)\.mount\(['"]#app['"]\)/g) || []).length
  if (mountCount !== 1) fail('CMS_207E_MOUNT_COUNT_INVALID', `expected exactly one guarded Vue mount, got ${mountCount}`)

  console.log(PASS_STATUS)
}

try {
  main()
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
