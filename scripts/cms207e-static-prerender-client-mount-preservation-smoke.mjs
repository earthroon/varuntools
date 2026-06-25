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

function stripComments(source) {
  return String(source || '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|\s)\/\/.*$/gm, '')
}

function main() {
  if (!fs.existsSync(MAIN_FILE)) fail('CMS_207E_MAIN_TS_MISSING', `${MAIN_FILE} is missing`)
  const source = stripComments(fs.readFileSync(MAIN_FILE, 'utf8'))

  if (source.includes('hasStaticArticlePrerender') || source.includes('if (!hasStaticArticlePrerender)')) {
    fail('CMS_207E_LEGACY_MOUNT_SKIP_REMAINS', 'legacy static prerender mount skip remains; CMS-207M requires client rehydrate')
  }
  if (!/const\s+root\s*=\s*document\.querySelector\(['"]#app['"]\)/.test(source)) {
    fail('CMS_207E_ROOT_MOUNT_GUARD_MISSING', 'root mount guard missing')
  }
  if (!source.includes('createApp(App).use(router).mount(root)')) {
    fail('CMS_207E_MOUNT_CALL_MISSING', 'Vue root mount call missing')
  }

  console.log(PASS_STATUS)
}

try {
  main()
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
