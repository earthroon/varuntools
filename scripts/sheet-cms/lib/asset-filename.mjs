import path from 'node:path'
import { extFromFileName, extFromMime } from './mime-policy.mjs'

const PAGE_TYPE_FOLDER_MAP = {
  work: 'works',
  product: 'products',
  commission: 'works',
  catalog: 'works',
  tool: 'works',
  lab: 'lab-markdown-gallery',
  doc: 'guide',
  page: 'pages',
}

export function safeAssetId(assetId) {
  const id = String(assetId ?? '').trim()
  if (!/^[a-z0-9][a-z0-9-_]*$/.test(id)) {
    throw new Error(`Unsafe assetId: ${id}`)
  }
  return id
}

export function safePageId(pageId) {
  const id = String(pageId ?? '').trim()
  if (!/^[a-z0-9][a-z0-9-_]*$/.test(id)) {
    throw new Error(`Unsafe pageId: ${id}`)
  }
  return id
}

export function safeFolderSegment(segment, label = 'folder') {
  const value = String(segment ?? '').trim()
  if (!/^[a-z0-9][a-z0-9-_]*$/.test(value)) {
    throw new Error(`Unsafe ${label}: ${value}`)
  }
  return value
}

export function pageTypeToFolder(pageType) {
  const type = String(pageType ?? '').trim().toLowerCase()
  if (!type) return ''
  return PAGE_TYPE_FOLDER_MAP[type] || `${safeFolderSegment(type, 'page type')}s`
}

export function resolveOriginalExtension({ fileName, mimeType, fallback = 'bin' }) {
  return extFromFileName(fileName) || extFromMime(mimeType, fallback)
}

export function generatedFileName({ assetId, ext }) {
  return `${safeAssetId(assetId)}.${String(ext ?? '').replace(/^\./, '').toLowerCase()}`
}

export function generatedPublicSrc(fileName) {
  return `/assets/generated/${fileName}`
}

export function generatedFilePath(outDir, fileName) {
  return path.join(outDir, fileName)
}

export function contentAssetSubdir(type) {
  const normalized = String(type ?? '').trim().toLowerCase()
  if (normalized === 'image') return 'images'
  return 'media'
}

export function generatedContentAssetPaths({ contentPagesDir, pageFolder, pageId, type, fileName }) {
  const folder = safeFolderSegment(pageFolder, 'page folder')
  const safePage = safePageId(pageId)
  const subdir = contentAssetSubdir(type)
  const safeFileName = path.basename(String(fileName ?? '').trim())
  if (!safeFileName) throw new Error('Generated asset fileName is required.')

  return {
    dir: path.join(contentPagesDir, folder, safePage, subdir),
    filePath: path.join(contentPagesDir, folder, safePage, subdir, safeFileName),
    repoPath: path.posix.join(contentPagesDir.replace(/\\/g, '/'), folder, safePage, subdir, safeFileName),
    src: `./${subdir}/${safeFileName}`,
    subdir,
  }
}
