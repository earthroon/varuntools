#!/usr/bin/env node
import path from 'node:path'
import { callAppsScriptGateway } from './lib/appscript-gateway-client.mjs'
import { readJson, writeJson } from './lib/write-json.mjs'

const DEFAULT_RAW_DIR = '.sheet-cms-cache/raw'
const DEFAULT_REPORT_PATH = '.sheet-cms-cache/finalize-publish.generated.json'

function parseArgs(argv) {
  const out = {}
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--raw-dir') out.rawDir = argv[++index]
    else if (arg === '--report') out.reportPath = argv[++index]
    else if (arg === '--status') out.status = argv[++index]
    else if (arg === '--commit-sha') out.commitSha = argv[++index]
    else if (arg === '--action-run-url') out.actionRunUrl = argv[++index]
    else if (arg === '--request-id') out.requestId = argv[++index]
    else if (arg === '--dry-run') out.dryRun = true
  }
  return out
}

function filled(value) {
  return String(value ?? '').trim().length > 0
}

function enabled(value) {
  return String(value ?? '').trim().toUpperCase() === 'Y'
}

async function maybeReadRaw(rawDir, name) {
  try {
    return await readJson(path.join(rawDir, `${name}.raw.json`))
  } catch (error) {
    if (error.code === 'ENOENT') return { rows: [] }
    throw error
  }
}

function normalizeStatus(value) {
  const status = String(value ?? '').trim().toLowerCase()
  return status || 'success'
}

function addPageId(set, value) {
  const pageId = String(value ?? '').trim()
  if (pageId) set.add(pageId)
}

function collectPublishedPageIds({ rawPages, rawBlocks, rawAssets }) {
  const pageIds = new Set()

  for (const row of rawPages?.rows ?? []) {
    if (!enabled(row.visible)) continue
    const status = String(row.status ?? '').trim().toLowerCase()
    if (['published', 'archived', 'hidden'].includes(status)) addPageId(pageIds, row.pageId)
  }

  for (const row of rawBlocks?.rows ?? []) {
    if (!enabled(row.visible)) continue
    addPageId(pageIds, row.pageId)
  }

  for (const row of rawAssets?.rows ?? []) {
    if (!enabled(row.visible)) continue
    addPageId(pageIds, row.pageId)
  }

  return [...pageIds].sort((a, b) => a.localeCompare(b))
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const rawDir = args.rawDir || process.env.SHEET_CMS_RAW_DIR || DEFAULT_RAW_DIR
  const reportPath = args.reportPath || process.env.SHEET_CMS_FINALIZE_REPORT || DEFAULT_REPORT_PATH
  const requestId = args.requestId || process.env.SHEET_CMS_REQUEST_ID || process.env.GITHUB_RUN_ID || ''
  const status = normalizeStatus(args.status || process.env.SHEET_CMS_FINALIZE_STATUS || 'success')
  const commitSha = args.commitSha || process.env.SHEET_CMS_COMMIT_SHA || ''
  const actionRunUrl = args.actionRunUrl || process.env.SHEET_CMS_ACTION_RUN_URL || ''
  const dryRun = Boolean(args.dryRun || String(process.env.SHEET_CMS_FINALIZE_DRY_RUN ?? '').toLowerCase() === 'true')

  const rawPages = await maybeReadRaw(rawDir, 'pages')
  const rawBlocks = await maybeReadRaw(rawDir, 'blocks')
  const rawAssets = await maybeReadRaw(rawDir, 'assets')
  const publishedPageIds = collectPublishedPageIds({ rawPages, rawBlocks, rawAssets })

  const payload = {
    status,
    commitSha: commitSha || undefined,
    actionRunUrl: actionRunUrl || undefined,
    publishedPageIds,
  }

  const report = {
    generatedAt: new Date().toISOString(),
    source: 'finalize:sheet-cms',
    requestId: requestId || undefined,
    status,
    commitSha: commitSha || undefined,
    actionRunUrl: actionRunUrl || undefined,
    publishedPageIds,
    dryRun,
    response: null,
    warnings: [],
    errors: [],
  }

  console.log(`[finalize:sheet-cms] requestId: ${requestId || 'missing'}`)
  console.log(`[finalize:sheet-cms] status: ${status}`)
  console.log(`[finalize:sheet-cms] published page ids: ${publishedPageIds.length}`)

  if (status === 'success' && publishedPageIds.length === 0) {
    report.warnings.push({ code: 'finalize.noPublishedPageIds', message: 'No visible staged page/block/asset rows were found for cleanup.' })
  }

  if (dryRun) {
    report.response = { ok: true, dryRun: true, payload }
    await writeJson(reportPath, report)
    console.log(`[finalize:sheet-cms] dry-run wrote ${reportPath}`)
    return
  }

  try {
    const response = await callAppsScriptGateway({ action: 'finalize', payload })
    report.response = response
    await writeJson(reportPath, report)
    console.log(`[finalize:sheet-cms] wrote ${reportPath}`)
    console.log('[finalize:sheet-cms] success')
  } catch (error) {
    report.errors.push({ code: 'finalize.gateway.failed', message: error.message })
    await writeJson(reportPath, report)
    console.error(`[finalize:sheet-cms] failed: ${error.message}`)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(`[finalize:sheet-cms] failed: ${error.message}`)
  process.exit(1)
})
