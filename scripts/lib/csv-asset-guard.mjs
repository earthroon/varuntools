import fs from 'node:fs'
import path from 'node:path'
import { createDiagnostic } from './csv-diagnostics.mjs'
import { parseOptionString } from './csv-options.mjs'

const DEFAULT_ALLOWED_ASSET_HOSTS = new Set(['varun.tools'])
const SAFE_EXTENSIONS = new Set(['.webp', '.png', '.jpg', '.jpeg', '.svg', '.avif', '.gif', '.mp4', '.webm', '.mov'])
const UNSAFE_PROTOCOLS = new Set(['javascript:', 'data:', 'file:', 'blob:'])
const IMAGE_EXTENSIONS = new Set(['.webp', '.png', '.jpg', '.jpeg', '.svg', '.avif', '.gif'])

function asString(value) {
  return String(value ?? '').trim()
}

function rowNumber(row) {
  return row.__rowNumber || row.__line || null
}

function normalizeSlashes(value) {
  return String(value ?? '').replace(/\\/g, '/')
}

function isExternalUrl(value) {
  return /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(asString(value))
}

function tryUrl(value) {
  try { return new URL(value) } catch { return null }
}

function extensionOf(value) {
  const pathname = isExternalUrl(value) ? (tryUrl(value)?.pathname || '') : value
  return path.extname(String(pathname).split(/[?#]/)[0]).toLowerCase()
}

function isImageReference(value) {
  return IMAGE_EXTENSIONS.has(extensionOf(value))
}

function projectRootFrom(context = {}) {
  return path.resolve(context.projectRoot || process.cwd())
}

function csvDirectory(context = {}) {
  const sourcePath = context.sourcePath || context.sourceCsvPath || 'page.csv'
  return path.dirname(path.resolve(projectRootFrom(context), sourcePath))
}

function diagnosticForReference(reference, input = {}) {
  return createDiagnostic({
    ...input,
    rowNumber: reference.rowNumber,
    block: reference.block,
    field: reference.field,
    optionKey: reference.optionKey || undefined,
  })
}

function addReference(references, row, field, value, input = {}) {
  const assetValue = asString(value)
  if (!assetValue && !input.required) return
  references.push({
    rowNumber: rowNumber(row),
    block: asString(row.block),
    field,
    optionKey: input.optionKey || null,
    value: assetValue,
    required: Boolean(input.required),
    altValue: input.altValue,
    captionValue: input.captionValue,
    altRecommended: Boolean(input.altRecommended),
    captionRecommended: Boolean(input.captionRecommended),
    sourcePath: input.sourcePath || row.__source || row.__sourcePath || '',
  })
}

function addRowField(references, row, field, input = {}) {
  addReference(references, row, field, row[field], input)
}

function addOptionReference(references, row, optionKey, value, input = {}) {
  addReference(references, row, 'options', value, { ...input, optionKey })
}

export function collectAssetReferences(rows = [], context = {}) {
  const references = []
  for (const row of rows) {
    const block = asString(row.block)
    const options = parseOptionString(row.options)
    const sourcePath = context.sourcePath || context.sourceCsvPath || row.__source || row.__sourcePath || ''
    const base = { sourcePath }

    switch (block) {
      case 'page':
        addRowField(references, row, 'src', { ...base, altValue: row.alt, altRecommended: Boolean(asString(row.src)) })
        addRowField(references, row, 'thumb', { ...base })
        break
      case 'portfolio-hero':
        addRowField(references, row, 'src', { ...base, altValue: row.alt, captionValue: row.caption, altRecommended: Boolean(asString(row.src)) })
        addRowField(references, row, 'thumb', { ...base })
        break
      case 'product':
        addRowField(references, row, 'src', { ...base, altValue: row.alt, altRecommended: Boolean(asString(row.src)) })
        addRowField(references, row, 'thumb', { ...base })
        break
      case 'image':
        addRowField(references, row, 'src', { ...base, required: true, altValue: row.alt, captionValue: row.caption, altRecommended: true, captionRecommended: true })
        addRowField(references, row, 'thumb', { ...base })
        break
      case 'before-after':
        addRowField(references, row, 'src', { ...base, required: true, altValue: row.alt, captionValue: row.caption, altRecommended: Boolean(asString(row.src)) })
        addOptionReference(references, row, 'before', options.before, { ...base })
        addOptionReference(references, row, 'after', options.after, { ...base, required: true })
        break
      case 'video':
        addRowField(references, row, 'src', { ...base, required: true, captionValue: row.caption })
        addRowField(references, row, 'thumb', { ...base })
        addOptionReference(references, row, 'poster', options.poster, { ...base })
        break
      case 'gallery-item':
      case 'case-gallery-item':
        addRowField(references, row, 'src', { ...base, required: true, altValue: row.alt, captionValue: row.caption || row.body, altRecommended: true, captionRecommended: true })
        addRowField(references, row, 'thumb', { ...base })
        break
      default:
        break
    }
  }
  return references
}

export function resolveAssetPath(reference, context = {}) {
  const value = asString(reference.value)
  const root = projectRootFrom(context)
  if (!value || isExternalUrl(value)) return null

  if (value.startsWith('/')) {
    const resolved = path.resolve(root, 'public', value.slice(1))
    return { kind: 'public', absolutePath: resolved, root: path.resolve(root, 'public') }
  }

  const resolved = path.resolve(csvDirectory(context), value)
  return { kind: 'local', absolutePath: resolved, root }
}

function isInside(child, parent) {
  const relative = path.relative(parent, child)
  return Boolean(relative && !relative.startsWith('..') && !path.isAbsolute(relative)) || relative === ''
}

export function isSafeAssetUrl(value, context = {}) {
  const raw = asString(value)
  const url = tryUrl(raw)
  if (!url) return { ok: false, code: 'CSV_ASSET_UNSAFE_PROTOCOL', protocol: '', host: '' }
  if (UNSAFE_PROTOCOLS.has(url.protocol)) return { ok: false, code: url.protocol === 'data:' ? 'CSV_ASSET_DATA_URL_BLOCKED' : 'CSV_ASSET_UNSAFE_PROTOCOL', protocol: url.protocol, host: url.hostname }
  if (url.protocol !== 'https:') return { ok: false, code: 'CSV_ASSET_UNSAFE_PROTOCOL', protocol: url.protocol, host: url.hostname }
  const hosts = new Set([...(context.allowedAssetHosts || DEFAULT_ALLOWED_ASSET_HOSTS)])
  if (!hosts.has(url.hostname)) return { ok: true, external: true, allowed: false, protocol: url.protocol, host: url.hostname }
  return { ok: true, external: true, allowed: true, protocol: url.protocol, host: url.hostname }
}

export function validateAssetReference(reference, context = {}) {
  const diagnostics = []
  const strict = Boolean(context.strict)
  const value = asString(reference.value)

  if (!value) {
    if (reference.required) {
      diagnostics.push(diagnosticForReference(reference, {
        level: 'error',
        code: 'CSV_ASSET_EMPTY_REFERENCE',
        message: `${reference.block} ${reference.optionKey || reference.field} asset reference is required.`,
      }))
    }
    return diagnostics
  }

  if (isExternalUrl(value)) {
    const safety = isSafeAssetUrl(value, context)
    if (!safety.ok) {
      diagnostics.push(diagnosticForReference(reference, {
        level: 'error',
        code: safety.code,
        message: safety.code === 'CSV_ASSET_DATA_URL_BLOCKED'
          ? 'data: asset URLs are blocked in CSV authoring.'
          : `Unsafe asset URL protocol "${safety.protocol || 'unknown'}".`,
      }))
      return diagnostics
    }

    diagnostics.push(diagnosticForReference(reference, {
      level: strict && !safety.allowed ? 'error' : 'warning',
      code: safety.allowed ? 'CSV_ASSET_EXTERNAL_URL' : 'CSV_ASSET_EXTERNAL_URL_NOT_ALLOWED',
      message: safety.allowed
        ? `External asset URL "${safety.host}" is allowed but should remain intentional.`
        : `External asset host "${safety.host}" is not in the CSV asset allowlist.`,
    }))
    return diagnostics
  }

  const resolved = resolveAssetPath(reference, context)
  const root = projectRootFrom(context)
  if (!resolved) return diagnostics

  const allowedRoot = resolved.kind === 'public' ? path.resolve(root, 'public') : root
  if (!isInside(resolved.absolutePath, allowedRoot)) {
    diagnostics.push(diagnosticForReference(reference, {
      level: 'error',
      code: 'CSV_ASSET_PATH_OUTSIDE_ROOT',
      message: `Asset path escapes the ${resolved.kind === 'public' ? 'public' : 'project'} root: ${normalizeSlashes(value)}.`,
    }))
    return diagnostics
  }

  const ext = extensionOf(value)
  if (ext && !SAFE_EXTENSIONS.has(ext)) {
    diagnostics.push(diagnosticForReference(reference, {
      level: strict ? 'error' : 'warning',
      code: 'CSV_ASSET_UNSUPPORTED_EXTENSION',
      message: `Asset extension "${ext}" is not in the supported asset extension list.`,
    }))
  }

  if (!fs.existsSync(resolved.absolutePath)) {
    diagnostics.push(diagnosticForReference(reference, {
      level: 'error',
      code: 'CSV_ASSET_MISSING',
      message: `Asset file does not exist: ${normalizeSlashes(path.relative(root, resolved.absolutePath))}.`,
    }))
  }

  if (reference.altRecommended && isImageReference(value) && !asString(reference.altValue)) {
    diagnostics.push(diagnosticForReference(reference, {
      level: strict ? 'error' : 'warning',
      code: 'CSV_ASSET_ALT_MISSING',
      message: `${reference.block} ${reference.optionKey || reference.field} image should provide alt text.`,
    }))
  }

  if (reference.captionRecommended && isImageReference(value) && !asString(reference.captionValue)) {
    diagnostics.push(diagnosticForReference(reference, {
      level: 'warning',
      code: 'CSV_ASSET_CAPTION_RECOMMENDED',
      message: `${reference.block} ${reference.optionKey || reference.field} image should provide a caption for portfolio review context.`,
    }))
  }

  return diagnostics
}

export function validateCsvAssetReferences(rows = [], context = {}) {
  const references = collectAssetReferences(rows, context)
  const diagnostics = []
  for (const reference of references) diagnostics.push(...validateAssetReference(reference, context))
  return diagnostics
}

export function summarizeAssetReferences(rows = [], context = {}) {
  const references = collectAssetReferences(rows, context)
  const summary = { checked: references.length, local: 0, public: 0, external: 0, missing: 0, warnings: 0, errors: 0 }
  for (const reference of references) {
    const value = asString(reference.value)
    if (!value) continue
    if (isExternalUrl(value)) summary.external += 1
    else if (value.startsWith('/')) summary.public += 1
    else summary.local += 1
  }
  const diagnostics = validateCsvAssetReferences(rows, context)
  summary.missing = diagnostics.filter((item) => item.code === 'CSV_ASSET_MISSING').length
  summary.warnings = diagnostics.filter((item) => item.level === 'warning').length
  summary.errors = diagnostics.filter((item) => item.level === 'error').length
  return summary
}

export function formatAssetReference(reference) {
  const key = reference.optionKey ? `${reference.field}.${reference.optionKey}` : reference.field
  return `row ${reference.rowNumber || '?'} ${reference.block}.${key}: ${reference.value || '(empty)'}`
}
