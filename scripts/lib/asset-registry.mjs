import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'

export function normalizeProjectPath(value) {
  return String(value || '').replace(/\\/g, '/')
}

function trimSource(value) {
  return String(value || '').trim()
}

function isExternalUrl(value) {
  return /^https?:\/\//i.test(value) || /^\/\//.test(value)
}

function isUnsupportedProtocol(value) {
  return /^[a-z][a-z0-9+.-]*:/i.test(value) && !/^https?:\/\//i.test(value) && !value.startsWith('data:')
}

function isRuntimeContentAssetPath(value) {
  return /^\/assets\/content\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\/[^?#\s]+$/i.test(String(value || '').trim())
}

function isInside(parent, child) {
  const rel = path.relative(parent, child)
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel))
}

function findCaseMismatch(absPath) {
  const parts = path.resolve(absPath).split(path.sep)
  let current = parts[0] || path.sep

  for (let i = 1; i < parts.length; i += 1) {
    const part = parts[i]
    if (!existsSync(current)) return false
    let entries = []
    try {
      entries = readdirSync(current)
    } catch {
      return false
    }
    if (entries.includes(part)) {
      current = path.join(current, part)
      continue
    }
    if (entries.some((entry) => entry.toLowerCase() === part.toLowerCase())) return true
    return false
  }

  return false
}

export function resolveFilesystemAsset(options) {
  const projectRoot = options.projectRoot || process.cwd()
  const contentRoot = options.contentRoot || path.join(projectRoot, 'src', 'content', 'pages')
  const publicRoot = options.publicRoot || path.join(projectRoot, 'public')
  const source = trimSource(options.source)
  const allowExternal = options.allowExternal !== false

  if (!source) {
    return { source, url: '', kind: 'missing', found: false, reason: 'empty_source' }
  }

  if (isExternalUrl(source)) {
    return {
      source,
      url: source,
      kind: allowExternal ? 'external' : 'invalid',
      found: allowExternal,
      reason: allowExternal ? 'external_url' : 'unsupported_protocol',
      warning: allowExternal ? 'external_url' : 'unsupported_protocol',
    }
  }

  if (source.startsWith('data:')) {
    return { source, url: source, kind: 'data', found: true, reason: 'data_url', warning: 'data_url' }
  }

  if (isUnsupportedProtocol(source)) {
    return { source, url: '', kind: 'invalid', found: false, reason: 'unsupported_protocol', warning: 'unsupported_protocol' }
  }

  if (isRuntimeContentAssetPath(source)) {
    const relativePath = source.replace(/^\/+/, '')
    return {
      source,
      url: source,
      kind: 'runtime',
      found: true,
      reason: 'runtime_content_asset_proxy',
      relativePath,
      warning: 'runtime_content_asset_proxy',
    }
  }

  if (source.startsWith('/')) {
    const relativePath = source.replace(/^\/+/, '')
    const absolutePath = path.resolve(publicRoot, relativePath)
    if (!isInside(publicRoot, absolutePath)) {
      return { source, url: '', kind: 'invalid', found: false, reason: 'unsafe_path', absolutePath, warning: 'unsafe_path' }
    }
    if (existsSync(absolutePath)) {
      return { source, url: source, kind: 'public', found: true, reason: 'public_path', absolutePath, relativePath }
    }
    return { source, url: source, kind: 'missing', found: false, reason: 'local_asset_missing', absolutePath, relativePath, warning: 'local_asset_missing' }
  }

  const baseDir = options.contentFilePath ? path.dirname(options.contentFilePath) : contentRoot
  const absolutePath = path.resolve(baseDir, source)

  if (!isInside(contentRoot, absolutePath)) {
    return { source, url: '', kind: 'invalid', found: false, reason: 'unsafe_path', absolutePath, warning: 'unsafe_path' }
  }

  const relativePath = normalizeProjectPath(path.relative(projectRoot, absolutePath))

  if (existsSync(absolutePath)) {
    return { source, url: source, kind: 'local', found: true, reason: 'local_asset_found', absolutePath, relativePath }
  }

  if (findCaseMismatch(absolutePath)) {
    return { source, url: source, kind: 'missing', found: false, reason: 'case_mismatch', absolutePath, relativePath, warning: 'case_mismatch' }
  }

  return { source, url: source, kind: 'missing', found: false, reason: 'local_asset_missing', absolutePath, relativePath, warning: 'local_asset_missing' }
}


export function getMediaAssetType(source) {
  const clean = String(source || '').split('?')[0].split('#')[0].toLowerCase()
  if (/\.(png|jpe?g|webp|gif|svg|avif)$/.test(clean)) return 'image'
  if (/\.(mp4|webm|ogg|ogv|mov)$/.test(clean)) return 'video'
  if (/\.(mp3|wav|m4a)$/.test(clean)) return 'audio'
  if (/\.(vtt|srt)$/.test(clean)) return 'subtitle'
  if (/\.(m3u8|mpd)$/.test(clean)) return 'stream'
  return 'unknown'
}

export function resolveFilesystemMediaAsset(options) {
  const result = resolveFilesystemAsset(options)
  const mediaType = getMediaAssetType(result.source)
  let mediaWarning = result.warning
  if (result.source && options.expectedType && mediaType !== 'unknown' && mediaType !== options.expectedType) {
    mediaWarning = `expected_${options.expectedType}_got_${mediaType}`
  }
  return {
    ...result,
    mediaType,
    expectedType: options.expectedType,
    warning: result.warning || mediaWarning,
    mediaWarning,
  }
}

