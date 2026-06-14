#!/usr/bin/env node
import path from 'node:path'
import { REQUIRED_TABS } from './lib/sheet-schema.mjs'
import { readTabFromFixture, readSnapshotFromGateway } from './lib/sheet-reader.mjs'
import { rowsToObjects } from './lib/row-normalizer.mjs'
import { writeJson } from './lib/write-json.mjs'
import { hashId } from './lib/hash-id.mjs'
import { describeGateway } from './lib/appscript-gateway-client.mjs'

function parseArgs(argv) {
  const out = {}
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--fixture') out.fixtureDir = argv[++index]
    else if (arg === '--out-dir') out.outDir = argv[++index]
    else if (arg === '--manifest') out.manifestPath = argv[++index]
    else if (arg === '--strict') out.strict = true
  }
  return out
}

function filled(value) {
  return String(value ?? '').trim().length > 0
}

function createManifest({ fixtureMode, gatewayDescription, requestId }) {
  return {
    generatedAt: new Date().toISOString(),
    source: fixtureMode ? 'fixture' : 'apps-script-gateway',
    gatewayUrlHash: gatewayDescription?.webAppUrl ? hashId(gatewayDescription.webAppUrl) : undefined,
    requestId: requestId || undefined,
    tabs: [],
    warnings: [],
    errors: [],
  }
}

function collectResultErrors(result, manifest) {
  for (const warning of result.warnings ?? []) manifest.warnings.push(warning)
  for (const error of result.errors ?? []) manifest.errors.push(error)
}

async function readAllTabs({ fixtureMode, fixtureDir }) {
  if (fixtureMode) {
    const tabs = {}
    for (const tabName of REQUIRED_TABS) {
      tabs[tabName] = await readTabFromFixture({ fixtureDir, tabName })
    }
    return { tabs, requestId: '' }
  }

  const snapshot = await readSnapshotFromGateway()
  return {
    tabs: snapshot.tabs,
    requestId: snapshot.requestId,
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const fixtureDir = args.fixtureDir || process.env.SHEET_CMS_FIXTURE_DIR || ''
  const fixtureMode = filled(fixtureDir)

  const outDir = args.outDir || process.env.SHEET_CMS_OUT_DIR || '.sheet-cms-cache/raw'
  const manifestPath = args.manifestPath || process.env.SHEET_CMS_MANIFEST || '.sheet-cms-cache/sheet-sync.generated.json'
  const strict = args.strict || String(process.env.SHEET_CMS_STRICT ?? '').toLowerCase() === 'true'

  const gatewayDescription = fixtureMode ? null : describeGateway(process.env)
  if (fixtureMode) {
    console.log('[sync:sheets] fixture mode:', path.resolve(fixtureDir))
  } else {
    console.log('[sync:sheets] Apps Script gateway:', gatewayDescription.webAppUrl)
    console.log('[sync:sheets] shared secret:', gatewayDescription.hasSharedSecret ? 'present' : 'missing')
  }

  const { tabs, requestId } = await readAllTabs({ fixtureMode, fixtureDir })
  const manifest = createManifest({ fixtureMode, gatewayDescription, requestId })

  for (const tabName of REQUIRED_TABS) {
    try {
      const values = tabs[tabName]
      if (!Array.isArray(values)) {
        throw new Error(`Apps Script snapshot did not include tab values for ${tabName}.`)
      }

      const result = rowsToObjects(tabName, values)
      collectResultErrors(result, manifest)

      const outPath = path.join(outDir, `${tabName}.raw.json`)
      await writeJson(outPath, result)

      manifest.tabs.push({
        name: tabName,
        rows: result.rows.length,
        headers: result.headers,
        emptyRowsSkipped: result.emptyRowsSkipped,
        warnings: result.warnings,
        errors: result.errors,
      })

      console.log(`[sync:sheets] loaded tab ${tabName}: ${result.rows.length} rows`)
      console.log(`[sync:sheets] wrote ${outPath}`)
    } catch (error) {
      manifest.errors.push({
        code: 'sheet.tab.readFailed',
        tab: tabName,
        message: error.message,
      })
      console.error(`[sync:sheets] failed tab ${tabName}: ${error.message}`)
    }
  }

  await writeJson(manifestPath, manifest)
  console.log(`[sync:sheets] wrote ${manifestPath}`)
  console.log(`[sync:sheets] warnings: ${manifest.warnings.length}`)
  console.log(`[sync:sheets] errors: ${manifest.errors.length}`)

  if (manifest.errors.length > 0) {
    for (const error of manifest.errors) {
      console.error(`[error:${error.code}] ${error.tab ? `${error.tab}: ` : ''}${error.message}`)
    }
    process.exit(1)
  }

  if (strict && manifest.warnings.length > 0) {
    console.error('[sync:sheets] strict mode rejected warnings.')
    process.exit(1)
  }

  console.log('[sync:sheets] success')
}

main().catch((error) => {
  console.error(`[sync:sheets] failed: ${error.message}`)
  process.exit(1)
})
