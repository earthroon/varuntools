import fs from 'node:fs/promises'
import path from 'node:path'
import { REQUIRED_TABS } from './sheet-schema.mjs'
import { callAppsScriptGateway } from './appscript-gateway-client.mjs'

export async function readTabFromFixture({ fixtureDir, tabName }) {
  const candidates = [
    path.join(fixtureDir, `${tabName}.values.json`),
    path.join(fixtureDir, `${tabName}.json`),
  ]

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(await fs.readFile(candidate, 'utf8'))
      if (Array.isArray(parsed)) return parsed
      if (Array.isArray(parsed.values)) return parsed.values
      throw new Error(`Fixture must be an array or { values: array }: ${candidate}`)
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
  }

  throw new Error(`Missing fixture for tab ${tabName} in ${fixtureDir}`)
}

function normalizeSnapshotPayload(data) {
  const source = data?.tabs || data?.sheets || data?.snapshot || data
  const out = {}

  if (Array.isArray(source)) {
    for (const entry of source) {
      const name = entry?.name || entry?.sheetName || entry?.tabName
      const values = entry?.values || entry?.rows
      if (name && Array.isArray(values)) out[name] = values
    }
    return out
  }

  if (source && typeof source === 'object') {
    for (const [name, value] of Object.entries(source)) {
      if (Array.isArray(value)) out[name] = value
      else if (Array.isArray(value?.values)) out[name] = value.values
    }
  }

  return out
}

export async function readSnapshotFromGateway() {
  const data = await callAppsScriptGateway({
    action: 'snapshot',
    payload: {
      tabs: REQUIRED_TABS,
    },
  })

  const tabs = normalizeSnapshotPayload(data)
  return {
    generatedAt: data?.generatedAt || new Date().toISOString(),
    source: data?.source || 'apps-script',
    requestId: data?.requestId || '',
    tabs,
  }
}
