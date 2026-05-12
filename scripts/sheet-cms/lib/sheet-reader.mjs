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
      if (Array.isArray(parsed.headers) && Array.isArray(parsed.rows)) {
        return tableToValues(parsed.headers, parsed.rows)
      }
      throw new Error(`Fixture must be an array, { values: array }, or { headers, rows }: ${candidate}`)
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
  }

  throw new Error(`Missing fixture for tab ${tabName} in ${fixtureDir}`)
}

function tableToValues(headers, rows) {
  const safeHeaders = Array.isArray(headers) ? headers : []
  const safeRows = Array.isArray(rows) ? rows : []

  return [
    safeHeaders,
    ...safeRows.map((row) => {
      return safeHeaders.map((header) => {
        const value = row?.[header]
        return value === undefined || value === null ? '' : String(value)
      })
    }),
  ]
}

function extractValues(value) {
  if (Array.isArray(value)) return value

  if (Array.isArray(value?.values)) {
    return value.values
  }

  if (Array.isArray(value?.headers) && Array.isArray(value?.rows)) {
    return tableToValues(value.headers, value.rows)
  }

  return null
}

function normalizeSnapshotPayload(data) {
  const source = data?.tabs || data?.sheets || data?.snapshot || data
  const out = {}

  if (Array.isArray(source)) {
    for (const entry of source) {
      const name = entry?.name || entry?.sheetName || entry?.tabName
      const values = extractValues(entry)
      if (name && Array.isArray(values)) out[name] = values
    }
    return out
  }

  if (source && typeof source === 'object') {
    for (const [name, value] of Object.entries(source)) {
      const values = extractValues(value)
      if (Array.isArray(values)) out[name] = values
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
