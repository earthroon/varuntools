#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const localEnvPath = path.join(root, '.env.sheet-cms.local')

function parseDotEnv(source) {
  const out = {}
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

function getEnv() {
  const fileEnv = fs.existsSync(localEnvPath)
    ? parseDotEnv(fs.readFileSync(localEnvPath, 'utf8'))
    : {}
  return { ...fileEnv, ...process.env }
}

function filled(value) {
  return String(value ?? '').trim().length > 0
}

function redact(value) {
  const text = String(value ?? '')
  if (text.length <= 8) return text ? '***' : ''
  return `${text.slice(0, 4)}...${text.slice(-4)}`
}

function fail(report, code, message) {
  report.errors.push({ code, message })
}

function warn(report, code, message) {
  report.warnings.push({ code, message })
}

function checkGateway(env, report) {
  const url = env.APPS_SCRIPT_WEBAPP_URL || env.SHEET_CMS_GATEWAY_URL
  if (!filled(url)) {
    fail(report, 'gateway.url.missing', 'Set APPS_SCRIPT_WEBAPP_URL to the deployed Apps Script Web App URL.')
  } else {
    if (!/^https:\/\//.test(url)) fail(report, 'gateway.url.notHttps', 'APPS_SCRIPT_WEBAPP_URL must be HTTPS.')
    if (!/script\.google\.com/.test(url)) {
      warn(report, 'gateway.url.nonGoogle', 'APPS_SCRIPT_WEBAPP_URL does not look like a script.google.com URL. Confirm this is intentional.')
    }
  }

  if (!filled(env.SHEET_CMS_SHARED_SECRET)) {
    fail(report, 'gateway.secret.missing', 'Set SHEET_CMS_SHARED_SECRET in GitHub Secrets and Apps Script PropertiesService.')
  } else if (String(env.SHEET_CMS_SHARED_SECRET).length < 24) {
    warn(report, 'gateway.secret.short', 'SHEET_CMS_SHARED_SECRET should be long and random, preferably 32+ chars.')
  }
}

function checkGitHubDispatch(env, report) {
  const expected = {
    GITHUB_OWNER: 'earthroon',
    GITHUB_REPO: 'varuntools',
    GITHUB_EVENT_TYPE: 'publish-sheet-content',
  }
  for (const [key, expectedValue] of Object.entries(expected)) {
    if (!filled(env[key])) {
      warn(report, `github.${key}.missing`, `${key} is not set locally. It must be set in Apps Script PropertiesService for publishing.`)
      continue
    }
    if (env[key] !== expectedValue) {
      warn(report, `github.${key}.unexpected`, `${key} is ${env[key]}, expected ${expectedValue}.`)
    }
  }
  if (filled(env.GITHUB_DISPATCH_TOKEN)) {
    warn(report, 'github.dispatchToken.local', 'GITHUB_DISPATCH_TOKEN is present locally. Keep it out of git and prefer Apps Script PropertiesService.')
  }
}

function checkNoDirectGoogleSecrets(env, report) {
  if (filled(env.GOOGLE_SERVICE_ACCOUNT_JSON) || filled(env.GOOGLE_APPLICATION_CREDENTIALS)) {
    warn(report, 'google.directCredential.present', 'Direct Google credentials are no longer required. Google access should stay inside Apps Script.')
  }
  if (filled(env.VARUNTOOLS_SHEET_ID) || filled(env.DRIVE_ASSET_FOLDER_ID)) {
    warn(report, 'google.directIds.present', 'Direct Sheet/Drive IDs are no longer required in GitHub Actions. Apps Script owns Google access.')
  }
}

function checkGitIgnore(report) {
  const gitignorePath = path.join(root, '.gitignore')
  if (!fs.existsSync(gitignorePath)) {
    warn(report, 'gitignore.missing', '.gitignore not found.')
    return
  }
  const text = fs.readFileSync(gitignorePath, 'utf8')
  const expected = ['.env.sheet-cms.local', '.secrets/', 'credentials.json', 'service-account.json']
  for (const pattern of expected) {
    if (!text.includes(pattern)) warn(report, 'gitignore.patternMissing', `.gitignore should include ${pattern}`)
  }
}

function main() {
  const env = getEnv()
  const report = {
    checkedAt: new Date().toISOString(),
    source: 'check:sheet-cms-auth',
    mode: 'apps-script-gateway',
    errors: [],
    warnings: [],
  }

  checkGateway(env, report)
  checkGitHubDispatch(env, report)
  checkNoDirectGoogleSecrets(env, report)
  checkGitIgnore(report)

  console.log('[check:sheet-cms-auth] mode: apps-script-gateway')
  console.log('[check:sheet-cms-auth] APPS_SCRIPT_WEBAPP_URL:', filled(env.APPS_SCRIPT_WEBAPP_URL || env.SHEET_CMS_GATEWAY_URL) ? redact(env.APPS_SCRIPT_WEBAPP_URL || env.SHEET_CMS_GATEWAY_URL) : 'missing')
  console.log('[check:sheet-cms-auth] SHEET_CMS_SHARED_SECRET:', filled(env.SHEET_CMS_SHARED_SECRET) ? 'present' : 'missing')
  console.log(`[check:sheet-cms-auth] warnings: ${report.warnings.length}`)
  console.log(`[check:sheet-cms-auth] errors: ${report.errors.length}`)

  for (const item of report.warnings) console.warn(`[warning:${item.code}] ${item.message}`)
  for (const item of report.errors) console.error(`[error:${item.code}] ${item.message}`)

  if (report.errors.length) process.exit(1)
  console.log('[check:sheet-cms-auth] success')
}

main()
