import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { resolveFilesystemAsset } from './asset-registry.mjs'

export const siteConfig = {
  name: 'VARUNTOOLS',
  origin: 'https://varun.tools',
  defaultDescription: '도구, 작업, 실험을 정리하는 VARUNTOOLS 쇼룸입니다.',
  defaultOgImage: '/og/default-og.svg',
}

export function projectPaths(projectRoot = process.cwd()) {
  return {
    projectRoot,
    contentRoot: path.join(projectRoot, 'src', 'content', 'pages'),
    publicRoot: path.join(projectRoot, 'public'),
  }
}

export function toProjectPath(projectRoot, filePath) {
  return path.relative(projectRoot, filePath).replace(/\\/g, '/')
}

export function walkMarkdownIndexFiles(dir) {
  const results = []
  if (!existsSync(dir)) return results
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) results.push(...walkMarkdownIndexFiles(fullPath))
    else if (entry.isFile() && entry.name === 'index.md') results.push(fullPath)
  }
  return results.sort()
}

export function readPages(options = {}) {
  const { projectRoot, contentRoot } = projectPaths(options.projectRoot)
  return walkMarkdownIndexFiles(contentRoot).map((file) => {
    const raw = readFileSync(file, 'utf8')
    const parsed = matter(raw)
    const data = parsed.data && typeof parsed.data === 'object' ? parsed.data : {}
    const relDir = path.relative(contentRoot, path.dirname(file)).replace(/\\/g, '/')
    const slug = typeof data.slug === 'string' && data.slug.trim() ? data.slug.trim() : relDir
    return { file, raw, frontmatter: data, slug, contentDir: relDir, projectPath: toProjectPath(projectRoot, file) }
  })
}

export function normalizeRoutePath(value) {
  const raw = String(value || '/').trim()
  if (!raw || raw === 'home') return '/'
  const withSlash = raw.startsWith('/') ? raw : `/${raw}`
  return withSlash === '/' ? '/' : withSlash.replace(/\/+$/, '')
}

export function routeForPage(page) {
  return page.slug === 'home' ? '/' : normalizeRoutePath(page.slug)
}

export function joinUrl(origin, routePath) {
  const cleanOrigin = origin.replace(/\/+$/, '')
  const cleanPath = String(routePath || '/').replace(/^\/+/, '')
  return cleanPath ? `${cleanOrigin}/${cleanPath}` : cleanOrigin
}

export function isNoindex(page) {
  const fm = page.frontmatter
  return Boolean(fm.noindex === true || fm.draft === true || fm.status === 'draft' || fm.visibility === 'hidden' || String(fm.robots || '').startsWith('noindex'))
}

export function resolveSeoForPage(page, options = {}) {
  const { projectRoot, contentRoot, publicRoot } = projectPaths(options.projectRoot)
  const fm = page.frontmatter
  const title = fm.seoTitle || fm.ogTitle || fm.title || siteConfig.name
  const description = fm.seoDescription || fm.ogDescription || fm.summary || fm.description || siteConfig.defaultDescription
  const routePath = routeForPage(page)
  const canonical = typeof fm.canonical === 'string' && /^https?:\/\//i.test(fm.canonical)
    ? fm.canonical
    : joinUrl(siteConfig.origin, fm.canonical || routePath)
  const ogCandidate = fm.ogImage || fm.cover || fm.thumbnail || fm.cardCover || siteConfig.defaultOgImage
  const asset = resolveFilesystemAsset({ source: ogCandidate, contentFilePath: page.file, projectRoot, contentRoot, publicRoot })
  const ogImage = /^https?:\/\//i.test(ogCandidate) || /^\/\//.test(ogCandidate)
    ? ogCandidate
    : ogCandidate.startsWith('/')
      ? joinUrl(siteConfig.origin, ogCandidate)
      : asset.found
        ? joinUrl(siteConfig.origin, asset.url)
        : joinUrl(siteConfig.origin, siteConfig.defaultOgImage)
  return { title, description, routePath, canonical, ogCandidate, ogImage, asset, noindex: isNoindex(page) }
}

export function defaultOgAssetExists(projectRoot = process.cwd()) {
  const { publicRoot } = projectPaths(projectRoot)
  const resolved = resolveFilesystemAsset({ source: siteConfig.defaultOgImage, contentFilePath: '', projectRoot, publicRoot })
  return resolved.found
}

export function lastmodForFile(file) {
  try { return statSync(file).mtime.toISOString().slice(0, 10) } catch { return '' }
}
