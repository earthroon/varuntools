#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const patchId = 'CMS-203'

async function pathExists(filePath) {
  try { await fs.access(filePath); return true } catch { return false }
}

async function readText(relativePath) {
  return fs.readFile(path.join(root, relativePath), 'utf8')
}

async function writeText(relativePath, text) {
  await fs.mkdir(path.dirname(path.join(root, relativePath)), { recursive: true })
  await fs.writeFile(path.join(root, relativePath), text, 'utf8')
}

async function backup(relativePath) {
  const fullPath = path.join(root, relativePath)
  if (!(await pathExists(fullPath))) return
  const backupPath = path.join(root, `_backup_${patchId.toLowerCase()}`, relativePath)
  await fs.mkdir(path.dirname(backupPath), { recursive: true })
  await fs.copyFile(fullPath, backupPath)
}

async function patchPackageJson() {
  const relativePath = 'package.json'
  await backup(relativePath)
  const fullPath = path.join(root, relativePath)
  const json = JSON.parse(await fs.readFile(fullPath, 'utf8'))
  json.scripts = json.scripts || {}
  const previous = json.scripts['sync:drive-assets']
  if (previous && previous !== 'node scripts/sheet-cms/sync-drive-assets.mjs' && !json.scripts['sync:drive-assets:legacy-appscript']) {
    json.scripts['sync:drive-assets:legacy-appscript'] = previous
  }
  json.scripts['sync:drive-assets'] = 'node scripts/sheet-cms/sync-drive-assets.mjs'
  await fs.writeFile(fullPath, `${JSON.stringify(json, null, 2)}\n`, 'utf8')
  console.log(`[${patchId}] patched package.json sync:drive-assets`)
}

async function patchWorkflow() {
  const relativePath = '.github/workflows/publish-sheet-cms.yml'
  await backup(relativePath)
  let text = await readText(relativePath)

  if (/SHEET_CMS_ASSET_SYNC_MODE:\s*/.test(text)) {
    text = text.replace(/SHEET_CMS_ASSET_SYNC_MODE:\s*[^\r\n]+/g, 'SHEET_CMS_ASSET_SYNC_MODE: vacms')
  } else if (/GENERATED_COMMIT_MESSAGE:\s*[^\r\n]+/.test(text)) {
    text = text.replace(/(GENERATED_COMMIT_MESSAGE:\s*[^\r\n]+\r?\n)/, `$1  SHEET_CMS_ASSET_SYNC_MODE: vacms\n`)
  } else if (/^env:\s*$/m.test(text)) {
    text = text.replace(/^env:\s*$/m, 'env:\n  SHEET_CMS_ASSET_SYNC_MODE: vacms')
  } else {
    text = text.replace(/(on:\s*\r?\n)/, `$1\nenv:\n  SHEET_CMS_ASSET_SYNC_MODE: vacms\n\n`)
  }

  text = text.replace(/- name: Sync Drive assets through Apps Script/g, '- name: Sync content assets')
  await writeText(relativePath, text)
  console.log(`[${patchId}] patched publish-sheet-cms.yml asset sync mode`)
}

function gatewayHelpers() {
  return `\nfunction redactGatewayText(text, env = process.env) {\n  let value = String(text || '')\n  const secret = String(env.SHEET_CMS_SHARED_SECRET || '')\n  if (secret) value = value.split(secret).join('[REDACTED_SECRET]')\n  value = value.replace(/[A-Za-z0-9+/=]{256,}/g, '[REDACTED_LONG_PAYLOAD]')\n  return value.slice(0, 1200)\n}\n\nfunction gatewayDataKeys(data) {\n  return data && typeof data === 'object' ? Object.keys(data) : []\n}\n\nfunction gatewayFailureMessage(data, status) {\n  if (data?.error && typeof data.error === 'object') return data.error.message || data.error.code || JSON.stringify(data.error)\n  return data?.error || data?.message || data?.details?.message || \`HTTP \${status}\`\n}\n`
}

async function patchGatewayClient() {
  const relativePath = 'scripts/sheet-cms/lib/appscript-gateway-client.mjs'
  await backup(relativePath)
  let text = await readText(relativePath)

  if (!text.includes('function redactGatewayText(')) {
    text = text.replace(/export async function callAppsScriptGateway/, `${gatewayHelpers()}\nexport async function callAppsScriptGateway`)
  }

  const oldBlock = `  if (!response.ok || data?.ok === false) {\n    const message = data?.error || data?.message || \`HTTP \${response.status}\`\n    throw new Error(\`Apps Script gateway \${action} failed: \${message}\`)\n  }`
  const newBlock = `  if (!response.ok || data?.ok === false) {\n    const bodyPreview = redactGatewayText(text)\n    console.error('[appscript-gateway] failed response', {\n      action,\n      status: response.status,\n      statusText: response.statusText,\n      contentType: response.headers.get('content-type'),\n      dataKeys: gatewayDataKeys(data),\n      bodyPreview,\n    })\n    const message = gatewayFailureMessage(data, response.status)\n    throw new Error(\`Apps Script gateway \${action} failed: \${message}\`)\n  }`

  if (text.includes(oldBlock)) {
    text = text.replace(oldBlock, newBlock)
  } else if (!text.includes("[appscript-gateway] failed response")) {
    throw new Error('Could not locate gateway failure block to patch.')
  }

  await writeText(relativePath, text)
  console.log(`[${patchId}] patched appscript gateway trace`)
}

async function main() {
  const required = [
    'package.json',
    '.github/workflows/publish-sheet-cms.yml',
    'scripts/sheet-cms/lib/appscript-gateway-client.mjs',
  ]
  for (const file of required) {
    if (!(await pathExists(path.join(root, file)))) throw new Error(`Run from public site repo root. Missing ${file}`)
  }

  await patchPackageJson()
  await patchWorkflow()
  await patchGatewayClient()
  console.log(`[${patchId}] patch applied`)
}

main().catch((error) => {
  console.error(`[${patchId}] patch failed: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
