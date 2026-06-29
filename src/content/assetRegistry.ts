export type AssetKind =
  | 'local'
  | 'public'
  | 'external'
  | 'content_asset'
  | 'data'
  | 'missing'
  | 'invalid'

export type AssetResolutionReason =
  | 'empty_source'
  | 'external_url'
  | 'content_asset_proxy'
  | 'data_url'
  | 'public_path'
  | 'local_asset_found'
  | 'local_asset_missing'
  | 'unsupported_protocol'
  | 'unsafe_path'
  | 'case_mismatch'
  | 'unknown'

export type AssetResolution = {
  source: string
  url: string
  kind: AssetKind
  found: boolean
  reason: AssetResolutionReason
  absolutePath?: string
  relativePath?: string
  warning?: string
}

type ResolveContentAssetOptions = {
  source: string | undefined
  contentFilePath?: string
  contentDir?: string
  contentRoot?: string
  publicBase?: string
  allowExternal?: boolean
}

const assetModules = import.meta.glob('./pages/**/*.{svg,png,jpg,jpeg,webp,avif,gif,webm,mp4,ogg,ogv,mov,vtt,srt,m3u8,mpd}', {
  query: '?url',
  import: 'default',
  eager: true,
})

const assetMap = new Map<string, string>(
  Object.entries(assetModules).map(([key, value]) => [normalizeSlash(key), String(value)]),
)

const CONTENT_ASSET_PUBLIC_BASE_URL = String(
  import.meta.env.VITE_ASSET_PUBLIC_BASE_URL ||
  import.meta.env.VITE_CONTENT_ASSET_PUBLIC_BASE_URL ||
  'https://varuntools-admin-api.ragoon703.workers.dev',
).replace(/\/+$/, '')

function normalizeSlash(value: string): string {
  return value.replace(/\\/g, '/')
}

function trimSource(value: string | undefined): string {
  return String(value || '').trim()
}

function isExternalUrl(value: string): boolean {
  return /^https?:\/\//i.test(value) || /^\/\//.test(value)
}

function isRuntimeContentAssetPath(value: string): boolean {
  return /^\/assets\/content\//i.test(value)
}

function resolveRuntimeContentAssetUrl(value: string): string {
  return `${CONTENT_ASSET_PUBLIC_BASE_URL}${value.startsWith('/') ? value : `/${value}`}`
}

function isUnsupportedProtocol(value: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(value) && !/^https?:\/\//i.test(value) && !value.startsWith('data:')
}

function stripDotSlash(value: string): string {
  return value.replace(/^\.\//, '')
}

function normalizeRelativePath(value: string): string | null {
  const clean = normalizeSlash(stripDotSlash(value))
  const segments: string[] = []

  for (const segment of clean.split('/')) {
    if (!segment || segment === '.') continue
    if (segment === '..') {
      if (!segments.length) return null
      segments.pop()
      continue
    }
    segments.push(segment)
  }

  return segments.join('/')
}

function contentDirFromFilePath(filePath: string | undefined): string {
  if (!filePath) return ''
  const normalized = normalizeSlash(filePath)
  const match = normalized.match(/src\/content\/pages\/(.*)\/index\.md$/)
  return match?.[1] || ''
}

export function resolveContentAsset(options: ResolveContentAssetOptions): AssetResolution {
  const source = trimSource(options.source)
  const allowExternal = options.allowExternal !== false

  if (!source) {
    return {
      source,
      url: '',
      kind: 'missing',
      found: false,
      reason: 'empty_source',
    }
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
    return {
      source,
      url: source,
      kind: 'data',
      found: true,
      reason: 'data_url',
      warning: 'data_url',
    }
  }

  if (isUnsupportedProtocol(source)) {
    return {
      source,
      url: '',
      kind: 'invalid',
      found: false,
      reason: 'unsupported_protocol',
      warning: 'unsupported_protocol',
    }
  }

  if (source.startsWith('/')) {
    if (isRuntimeContentAssetPath(source)) {
      return {
        source,
        url: resolveRuntimeContentAssetUrl(source),
        kind: 'content_asset',
        found: true,
        reason: 'content_asset_proxy',
        relativePath: source.replace(/^\/+/, ''),
      }
    }

    return {
      source,
      url: source,
      kind: 'public',
      found: true,
      reason: 'public_path',
      relativePath: source.replace(/^\/+/, ''),
    }
  }

  const clean = normalizeRelativePath(source)
  if (!clean) {
    return {
      source,
      url: '',
      kind: 'invalid',
      found: false,
      reason: 'unsafe_path',
      warning: 'unsafe_path',
    }
  }

  const contentDir = normalizeSlash(options.contentDir || contentDirFromFilePath(options.contentFilePath))
  const key = normalizeSlash(`./pages/${contentDir}/${clean}`)
  const url = assetMap.get(key)

  if (url) {
    return {
      source,
      url,
      kind: 'local',
      found: true,
      reason: 'local_asset_found',
      relativePath: key,
    }
  }

  return {
    source,
    url: source,
    kind: 'missing',
    found: false,
    reason: 'local_asset_missing',
    relativePath: key,
    warning: 'local_asset_missing',
  }
}

export function resolveContentAssetFromDir(contentDir: string, source: string | undefined): AssetResolution {
  return resolveContentAsset({ source, contentDir })
}


export type MediaAssetType = 'image' | 'video' | 'audio' | 'subtitle' | 'stream' | 'unknown'

export function getMediaAssetType(source: string): MediaAssetType {
  const clean = source.split('?')[0]?.split('#')[0]?.toLowerCase() || ''
  if (/\.(png|jpe?g|webp|gif|svg|avif)$/.test(clean)) return 'image'
  if (/\.(mp4|webm|ogg|ogv|mov)$/.test(clean)) return 'video'
  if (/\.(mp3|wav|m4a)$/.test(clean)) return 'audio'
  if (/\.(vtt|srt)$/.test(clean)) return 'subtitle'
  if (/\.(m3u8|mpd)$/.test(clean)) return 'stream'
  return 'unknown'
}

export type MediaAssetResolution = AssetResolution & {
  mediaType: MediaAssetType
  expectedType?: MediaAssetType
  mediaWarning?: string
}

export function resolveMediaAsset(options: ResolveContentAssetOptions & { expectedType?: MediaAssetType }): MediaAssetResolution {
  const result = resolveContentAsset(options)
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

