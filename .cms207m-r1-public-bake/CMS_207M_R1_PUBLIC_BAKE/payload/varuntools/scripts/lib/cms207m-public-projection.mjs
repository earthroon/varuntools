import fs from 'node:fs'
import path from 'node:path'

export const CMS207M_R1_CONTENT_PROJECTION_SCHEMA = 'cms-207m-public-content-projection@1'
export const CMS207M_R1_ASSET_MANIFEST_SCHEMA = 'cms-207m-public-asset-manifest@1'
export const CMS207M_R1_VACMS_PROJECTION_SCHEMA = 'vacms-public-projection@1'

export function normalizeSlash(value) {
  return String(value || '').replace(/\\/g, '/')
}

export function trimSlashes(value) {
  return normalizeSlash(value).replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/')
}

export function readJson(file, fallback = null) {
  if (!fs.existsSync(file)) return fallback
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function parseQuoted(text) {
  if (text.length < 2) return text
  const first = text[0]
  const last = text[text.length - 1]
  if (first === '"' && last === '"') {
    try { return JSON.parse(text) } catch { return text.slice(1, -1) }
  }
  if (first === "'" && last === "'") return text.slice(1, -1)
  return text
}

export function parseScalar(raw) {
  const text = String(raw ?? '').trim()
  if (!text) return ''
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    return parseQuoted(text)
  }
  if (text === 'true') return true
  if (text === 'false') return false
  if (text === 'null') return null
  if (/^-?\d+(?:\.\d+)?$/.test(text)) return Number(text)
  if ((text.startsWith('{') && text.endsWith('}')) || (text.startsWith('[') && text.endsWith(']'))) {
    try { return JSON.parse(text) } catch {}
  }
  return text.replace(/\s+#.*$/, '').trim()
}

export function parseFrontmatter(markdown) {
  const source = String(markdown || '').replace(/^\uFEFF/, '')
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (!match) return {}

  const root = {}
  const stack = [{ indent: -1, value: root }]
  const lines = match[1].replace(/\r\n/g, '\n').split('\n')

  for (let i = 0; i < lines.length; i += 1) {
    const rawLine = lines[i]
    if (!rawLine.trim() || rawLine.trim().startsWith('#')) continue

    const indent = rawLine.match(/^\s*/)?.[0].length || 0
    const line = rawLine.trim()
    const listItem = line.match(/^-\s+(.*)$/)
    if (listItem) {
      const current = stack[stack.length - 1]?.value
      if (Array.isArray(current)) current.push(parseScalar(listItem[1]))
      continue
    }

    const pair = line.match(/^([A-Za-z0-9_.-]+):(?:\s*(.*))?$/)
    if (!pair) continue

    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop()
    const parent = stack[stack.length - 1].value
    if (!parent || typeof parent !== 'object' || Array.isArray(parent)) continue

    const key = pair[1]
    const valueText = pair[2] ?? ''
    if (!valueText.trim()) {
      const nextLine = lines.slice(i + 1).find((candidate) => candidate.trim() && !candidate.trim().startsWith('#')) || ''
      const nextIndent = nextLine.match(/^\s*/)?.[0].length || 0
      const container = nextLine.trim().startsWith('- ') && nextIndent > indent ? [] : {}
      parent[key] = container
      stack.push({ indent, value: container })
      continue
    }
    parent[key] = parseScalar(valueText)
  }

  return root
}

export function listIndexMarkdown(root) {
  const out = []
  if (!fs.existsSync(root)) return out
  const stack = [root]
  while (stack.length) {
    const current = stack.pop()
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) stack.push(full)
      else if (entry.isFile() && entry.name === 'index.md') out.push(full)
    }
  }
  return out.sort((a, b) => normalizeSlash(a).localeCompare(normalizeSlash(b)))
}

export function readString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export function readBoolean(value) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  const text = readString(value).toLowerCase()
  return text === 'true' || text === '1' || text === 'yes'
}

export function readNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function readArray(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean)
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean)
  return []
}

export function readObject(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value
  if (typeof value === 'string' && value.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
    } catch {}
  }
  return {}
}

export function readTime(...values) {
  for (const value of values) {
    const text = String(value || '').trim()
    if (!text) continue
    const direct = Date.parse(text)
    if (Number.isFinite(direct)) return direct
    const year = text.match(/(?:19|20)\d{2}/)?.[0]
    if (year) {
      const fallback = Date.parse(`${year}-01-01`)
      if (Number.isFinite(fallback)) return fallback
    }
  }
  return 0
}

export function stableJson(value) {
  return JSON.stringify(value, null, 2) + '\n'
}

export function loadVacmsProjectionSidecars(root) {
  const byPageId = new Map()
  if (!fs.existsSync(root)) return byPageId
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.projection.json')) continue
    const file = path.join(root, entry.name)
    const payload = readJson(file, null)
    if (!payload || payload.schemaVersion !== CMS207M_R1_VACMS_PROJECTION_SCHEMA) {
      throw new Error(`E_CMS207M_INVALID_VACMS_PROJECTION_SIDECAR:${normalizeSlash(file)}`)
    }
    const pageId = readString(payload.page?.pageId)
    if (!pageId) throw new Error(`E_CMS207M_PROJECTION_PAGE_ID_MISSING:${normalizeSlash(file)}`)
    const existing = byPageId.get(pageId)
    if (existing && stableJson(existing.payload) !== stableJson(payload)) {
      throw new Error(`E_CMS207M_DUPLICATE_PAGE_PROJECTION:${pageId}`)
    }
    byPageId.set(pageId, { file: normalizeSlash(file), payload })
  }
  return byPageId
}
