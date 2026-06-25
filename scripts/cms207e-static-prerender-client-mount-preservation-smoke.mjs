#!/usr/bin/env node
import fs from 'node:fs'
import process from 'node:process'

const PASS_STATUS = 'PASS_CMS_207E_STATIC_PRERENDER_CLIENT_MOUNT_PRESERVATION'
const MAIN_FILE = 'src/main.ts'

function fail(code, message) {
  const error = new Error(message)
  error.code = code
  throw error
}

function main() {
  if (!fs.existsSync(MAIN_FILE)) fail('CMS_207E_MAIN_TS_MISSING', `${MAIN_FILE} is missing`)
  const source = fs.readFileSync(MAIN_FILE, 'utf8')

  const required = [
    ['CMS_207E_META_MARKER_MISSING', 'meta[name="vacms-static-article-prerender"]'],
    ['CMS_207E_ROOT_MARKER_MISSING', 'data-vacms-static-prerender'],
    ['CMS_207E_ARTICLE_MARKER_MISSING', 'data-vacms-static-article'],
    ['CMS_207E_GUARD_NAME_MISSING', 'hasStaticArticlePrerender'],
  ]

  for (const [code, token] of required) {
    if (!source.includes(token)) fail(code, `${MAIN_FILE} does not contain ${token}`)
  }

  const mountIndex = source.indexOf('createApp(App).use(router).mount')
  const guardIndex = source.indexOf('if (!hasStaticArticlePrerender)')
  if (mountIndex < 0) fail('CMS_207E_MOUNT_CALL_MISSING', 'Vue mount call missing')
  if (guardIndex < 0) fail('CMS_207E_MOUNT_GUARD_MISSING', 'mount guard missing')
  if (mountIndex < guardIndex) fail('CMS_207E_MOUNT_BEFORE_GUARD', 'Vue mount appears before static prerender guard')

  const guardedBlock = /if\s*\(!hasStaticArticlePrerender\)\s*\{[\s\S]*?createApp\(App\)\.use\(router\)\.mount\(['"]#app['"]\)[\s\S]*?\}/m
  if (!guardedBlock.test(source)) {
    fail('CMS_207E_MOUNT_NOT_GUARDED', 'Vue mount is not guarded by !hasStaticArticlePrerender')
  }

  console.log(PASS_STATUS)
}

try {
  main()
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
