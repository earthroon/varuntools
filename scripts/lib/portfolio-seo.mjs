import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { readPortfolioTagIndex, createPortfolioTagSeoEntries } from './portfolio-tags.mjs'

export const DEFAULT_SITE = {
  origin: process.env.SITE_ORIGIN || 'https://varun.tools',
  defaultTitle: 'VARUNTOOLS',
  defaultDescription: '도구, 작업, 실험을 정리하는 VARUNTOOLS 쇼룸입니다.',
  defaultImage: '/og/default-og.svg',
}

const WARNING_CODES = {
  MISSING_TITLE: 'PORTFOLIO_SEO_MISSING_TITLE',
  MISSING_DESCRIPTION: 'PORTFOLIO_SEO_MISSING_DESCRIPTION',
  MISSING_IMAGE: 'PORTFOLIO_SEO_MISSING_IMAGE',
  IMAGE_MISSING_FILE: 'PORTFOLIO_SEO_IMAGE_MISSING_FILE',
  PRIVATE_INDEXED: 'PORTFOLIO_SEO_PRIVATE_INDEXED',
  DRAFT_INDEXED: 'PORTFOLIO_SEO_DRAFT_INDEXED',
  CANONICAL_INVALID: 'PORTFOLIO_SEO_CANONICAL_INVALID',
  SITEMAP_EMPTY: 'PORTFOLIO_SEO_SITEMAP_EMPTY',
}

export { WARNING_CODES as PORTFOLIO_SEO_WARNING_CODES }

function cleanScalar(value = '') {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) return raw.slice(1, -1)
  if (raw === 'true') return true
  if (raw === 'false') return false
  if (raw === 'null') return null
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw)
  if (raw.startsWith('[') && raw.endsWith(']')) return raw.slice(1, -1).split(',').map((item) => cleanScalar(item)).filter((item) => item !== '')
  return raw
}

export function parseFrontmatter(raw = '') {
  const text = String(raw)
  if (!text.startsWith('---')) return { data: {}, content: text }
  const end = text.indexOf('\n---', 3)
  if (end < 0) return { data: {}, content: text }
  const yaml = text.slice(3, end).replace(/^\r?\n/, '')
  const content = text.slice(end).replace(/^\n---\r?\n?/, '')
  const data = {}
  const lines = yaml.split(/\r?\n/)
  let currentKey = ''
  let currentNested = null
  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue
    const listMatch = line.match(/^\s+-\s+(.+)$/)
    if (listMatch && currentKey) {
      if (!Array.isArray(data[currentKey])) data[currentKey] = []
      data[currentKey].push(cleanScalar(listMatch[1]))
      continue
    }
    const nestedMatch = line.match(/^\s{2}([A-Za-z0-9_.-]+):\s*(.*)$/)
    if (nestedMatch && currentNested && data[currentNested] && typeof data[currentNested] === 'object' && !Array.isArray(data[currentNested])) {
      data[currentNested][nestedMatch[1]] = cleanScalar(nestedMatch[2])
      continue
    }
    const pair = line.match(/^([A-Za-z0-9_.-]+):\s*(.*)$/)
    if (!pair) continue
    const [, key, value] = pair
    currentKey = key
    currentNested = null
    if (value === '') {
      data[key] = []
      currentNested = key
    } else {
      data[key] = cleanScalar(value)
    }
  }
  return { data, content }
}

export function walkIndexMarkdownFiles(dir) {
  const output = []
  if (!existsSync(dir)) return output
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) output.push(...walkIndexMarkdownFiles(full))
    else if (entry.isFile() && entry.name === 'index.md') output.push(full)
  }
  return output.sort()
}

function stripMarkdownForExcerpt(content = '') {
  return String(content)
    .replace(/:::[\s\S]*?:::/g, ' ')
    .replace(/::[\s\S]*?::/g, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^#+\s*/gm, '')
    .replace(/[*_`>#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function readPortfolioPages(options = {}) {
  const projectRoot = options.projectRoot || process.cwd()
  const contentRoot = options.contentRoot || path.join(projectRoot, 'src', 'content', 'pages')
  return walkIndexMarkdownFiles(contentRoot).map((file) => {
    const raw = readFileSync(file, 'utf8')
    const parsed = parseFrontmatter(raw)
    const contentDir = path.relative(contentRoot, path.dirname(file)).replace(/\\/g, '/')
    const slug = String(parsed.data.slug || contentDir || 'home').replace(/^\/+/, '')
    return {
      file,
      raw,
      content: parsed.content,
      frontmatter: parsed.data,
      slug,
      contentDir,
      sourcePath: path.relative(projectRoot, file).replace(/\\/g, '/'),
      excerpt: stripMarkdownForExcerpt(parsed.content).slice(0, 180),
    }
  })
}

export function normalizeRoutePath(value = '/') {
  const raw = String(value || '/').trim()
  if (!raw || raw === 'home') return '/'
  const withSlash = raw.startsWith('/') ? raw : `/${raw}`
  return withSlash === '/' ? '/' : withSlash.replace(/\/+$/, '')
}

export function joinUrl(origin, routePath = '/') {
  const cleanOrigin = String(origin || DEFAULT_SITE.origin).replace(/\/+$/, '')
  const cleanPath = String(routePath || '/').replace(/^\/+/, '')
  return cleanPath ? `${cleanOrigin}/${cleanPath}` : cleanOrigin
}

export function isExternalUrl(value = '') {
  return /^https?:\/\//i.test(String(value)) || /^\/\//.test(String(value))
}

export function routeForPage(page) {
  return normalizeRoutePath(page.slug === 'home' ? '/' : page.slug)
}

export function resolveSeoTitle(page) {
  const fm = page.frontmatter || {}
  const work = fm.work && typeof fm.work === 'object' ? fm.work : {}
  return String(fm.seoTitle || fm.ogTitle || fm.title || work.title || page.slug || DEFAULT_SITE.defaultTitle).trim()
}

export function resolveSeoDescription(page) {
  const fm = page.frontmatter || {}
  const work = fm.work && typeof fm.work === 'object' ? fm.work : {}
  return String(fm.seoDescription || fm.ogDescription || fm.description || work.summary || fm.summary || page.excerpt || DEFAULT_SITE.defaultDescription).trim()
}

function pathToPublicUrl(projectRoot, absolutePath) {
  const publicRoot = path.join(projectRoot, 'public')
  const contentRoot = path.join(projectRoot, 'src', 'content', 'pages')
  const publicRel = path.relative(publicRoot, absolutePath).replace(/\\/g, '/')
  if (!publicRel.startsWith('..')) return `/${publicRel}`
  const contentRel = path.relative(contentRoot, absolutePath).replace(/\\/g, '/')
  if (!contentRel.startsWith('..')) return `/content/${contentRel}`
  return ''
}

export function resolveAssetCandidate(candidate, page, options = {}) {
  const projectRoot = options.projectRoot || process.cwd()
  const clean = String(candidate || '').trim()
  if (!clean) return { src: '', url: '', exists: false, external: false, normalizedPath: '', warningCodes: [WARNING_CODES.MISSING_IMAGE] }
  if (isExternalUrl(clean)) return { src: clean, url: clean.startsWith('//') ? `https:${clean}` : clean, exists: true, external: true, normalizedPath: clean, warningCodes: [] }

  const publicRoot = path.join(projectRoot, 'public')
  const baseDir = path.dirname(page.file || '')
  let absolutePath = ''
  if (clean.startsWith('/')) absolutePath = path.join(publicRoot, clean.replace(/^\/+/, ''))
  else absolutePath = path.resolve(baseDir, clean)
  const exists = existsSync(absolutePath)
  const url = exists ? pathToPublicUrl(projectRoot, absolutePath) : ''
  return {
    src: clean,
    url,
    exists,
    external: false,
    normalizedPath: exists ? path.relative(projectRoot, absolutePath).replace(/\\/g, '/') : absolutePath,
    warningCodes: exists ? [] : [WARNING_CODES.IMAGE_MISSING_FILE],
  }
}

function loadAssetManifest(options = {}) {
  const projectRoot = options.projectRoot || process.cwd()
  const manifestPath = options.assetManifestPath || path.join(projectRoot, 'src', 'content', 'generated', 'portfolio-asset-manifest.json')
  if (!existsSync(manifestPath)) return null
  try { return JSON.parse(readFileSync(manifestPath, 'utf8')) } catch { return null }
}

export function resolveSeoImage(page, assetManifest = null, options = {}) {
  const fm = page.frontmatter || {}
  const work = fm.work && typeof fm.work === 'object' ? fm.work : {}
  const candidate = fm.ogImage || fm.image || work.cover || fm.cover || fm.thumbnail || fm.cardCover
  if (candidate) {
    const resolved = resolveAssetCandidate(candidate, page, options)
    if (resolved.exists) return { image: resolved.external ? resolved.url : joinUrl(options.origin || DEFAULT_SITE.origin, resolved.url), imageExists: true, warningCodes: resolved.warningCodes }
    return { image: joinUrl(options.origin || DEFAULT_SITE.origin, DEFAULT_SITE.defaultImage), imageExists: false, warningCodes: resolved.warningCodes }
  }

  const manifestCover = (assetManifest?.assets || []).find((asset) => asset.pageSlug === page.slug && asset.role === 'cover' && asset.exists)
  if (manifestCover?.src) {
    const resolved = resolveAssetCandidate(manifestCover.src, page, options)
    if (resolved.exists) return { image: joinUrl(options.origin || DEFAULT_SITE.origin, resolved.url), imageExists: true, warningCodes: [] }
  }
  return { image: joinUrl(options.origin || DEFAULT_SITE.origin, DEFAULT_SITE.defaultImage), imageExists: existsSync(path.join(options.projectRoot || process.cwd(), 'public', DEFAULT_SITE.defaultImage.replace(/^\/+/, ''))), warningCodes: [WARNING_CODES.MISSING_IMAGE] }
}

export function isIndexablePortfolioPage(page) {
  const fm = page.frontmatter || {}
  const work = fm.work && typeof fm.work === 'object' ? fm.work : {}
  const status = String(work.status || fm.status || '').toLowerCase()
  const visibility = String(fm.visibility || work.visibility || '').toLowerCase()
  const robots = String(fm.robots || '').toLowerCase()
  if (fm.noindex === true || fm.draft === true) return false
  if (status === 'draft' || status === 'private') return false
  if (visibility === 'hidden' || visibility === 'private') return false
  if (robots.startsWith('noindex')) return false
  return true
}

export function lastmodForFile(file) {
  try { return statSync(file).mtime.toISOString().slice(0, 10) } catch { return '' }
}

export function buildPortfolioSeoEntries(pages, context = {}) {
  const origin = context.origin || DEFAULT_SITE.origin
  const assetManifest = context.assetManifest || loadAssetManifest(context)
  return pages.map((page) => {
    const fm = page.frontmatter || {}
    const work = fm.work && typeof fm.work === 'object' ? fm.work : {}
    const routePath = routeForPage(page)
    const canonicalSource = String(fm.canonical || routePath)
    const canonicalUrl = isExternalUrl(canonicalSource) ? canonicalSource : joinUrl(origin, canonicalSource)
    const title = resolveSeoTitle(page)
    const description = resolveSeoDescription(page)
    const imageResult = resolveSeoImage(page, assetManifest, { ...context, origin })
    const indexable = isIndexablePortfolioPage(page)
    const warningCodes = []
    if (!title) warningCodes.push(WARNING_CODES.MISSING_TITLE)
    if (!description) warningCodes.push(WARNING_CODES.MISSING_DESCRIPTION)
    if (imageResult.warningCodes?.length) warningCodes.push(...imageResult.warningCodes)
    if (!/^https?:\/\//i.test(canonicalUrl)) warningCodes.push(WARNING_CODES.CANONICAL_INVALID)
    if (indexable && (String(work.status || fm.status).toLowerCase() === 'draft')) warningCodes.push(WARNING_CODES.DRAFT_INDEXED)
    if (indexable && (String(work.status || fm.status).toLowerCase() === 'private')) warningCodes.push(WARNING_CODES.PRIVATE_INDEXED)
    return {
      slug: page.slug,
      href: routePath,
      canonicalUrl,
      title: title || DEFAULT_SITE.defaultTitle,
      description: description || DEFAULT_SITE.defaultDescription,
      image: imageResult.image,
      imageExists: imageResult.imageExists,
      type: String(work.type || fm.type || fm.kind || ''),
      status: String(work.status || fm.status || 'published'),
      indexable,
      noindexReason: indexable ? '' : 'draft/private/hidden/noindex',
      sourcePath: page.sourcePath,
      lastmod: lastmodForFile(page.file),
      warningCodes: [...new Set(warningCodes)],
    }
  })
}


export function createSearchSeoEntry(context = {}) {
  const origin = context.origin || DEFAULT_SITE.origin
  const canonicalUrl = joinUrl(origin, '/search')
  return {
    slug: 'search',
    href: '/search',
    canonicalUrl,
    title: `Search | ${DEFAULT_SITE.defaultTitle}`,
    description: 'VARUNTOOLS의 작업, 문서, 페이지를 검색합니다.',
    image: joinUrl(origin, DEFAULT_SITE.defaultImage),
    imageExists: existsSync(path.join(context.projectRoot || process.cwd(), 'public', DEFAULT_SITE.defaultImage.replace(/^\/+/, ''))),
    type: 'page',
    status: 'published',
    indexable: true,
    noindexReason: '',
    sourcePath: 'src/pages/SearchPage.vue',
    lastmod: '',
    warningCodes: [],
  }
}

export function createPortfolioSeoManifest(entries, context = {}) {
  const indexable = entries.filter((entry) => entry.indexable)
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    site: {
      origin: context.origin || DEFAULT_SITE.origin,
      defaultTitle: DEFAULT_SITE.defaultTitle,
      defaultDescription: DEFAULT_SITE.defaultDescription,
    },
    pages: entries,
    summary: {
      total: entries.length,
      indexable: indexable.length,
      noindex: entries.length - indexable.length,
      missingTitle: entries.filter((entry) => entry.warningCodes.includes(WARNING_CODES.MISSING_TITLE)).length,
      missingDescription: entries.filter((entry) => entry.warningCodes.includes(WARNING_CODES.MISSING_DESCRIPTION)).length,
      missingImage: entries.filter((entry) => entry.warningCodes.includes(WARNING_CODES.MISSING_IMAGE) || entry.warningCodes.includes(WARNING_CODES.IMAGE_MISSING_FILE)).length,
    },
  }
}

function escapeXml(value = '') {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

function sitemapPriority(entry) {
  if (entry.href === '/') return '1.0'
  if (entry.href === '/works') return '0.8'
  if (entry.type === 'tag' || String(entry.href || '').startsWith('/works/tags/')) return '0.5'
  return '0.7'
}

export function renderSitemapXml(entries, context = {}) {
  const urls = []
  const add = (entry) => {
    if (!entry.indexable) return
    if (!/^https?:\/\//i.test(entry.canonicalUrl)) return
    if (String(entry.href || '').includes('?')) return
    if (urls.some((item) => item.loc === entry.canonicalUrl)) return
    urls.push({ loc: entry.canonicalUrl, lastmod: entry.lastmod, changefreq: 'monthly', priority: sitemapPriority(entry) })
  }
  entries.forEach(add)
  if (!urls.length) urls.push({ loc: context.origin || DEFAULT_SITE.origin, changefreq: 'monthly', priority: '1.0' })
  urls.sort((a, b) => a.loc.localeCompare(b.loc))
  const body = urls.map((url) => ['  <url>', `    <loc>${escapeXml(url.loc)}</loc>`, url.lastmod ? `    <lastmod>${escapeXml(url.lastmod)}</lastmod>` : '', `    <changefreq>${url.changefreq}</changefreq>`, `    <priority>${url.priority}</priority>`, '  </url>'].filter(Boolean).join('\n')).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
}

export function renderRobotsTxt(context = {}) {
  const origin = context.origin || DEFAULT_SITE.origin
  return `User-agent: *\nAllow: /\n\nSitemap: ${joinUrl(origin, '/sitemap.xml')}\n`
}

export function buildAndWritePortfolioSeo(options = {}) {
  const projectRoot = options.projectRoot || process.cwd()
  const origin = options.origin || process.env.SITE_ORIGIN || DEFAULT_SITE.origin
  const pages = readPortfolioPages({ projectRoot })
  const tagIndex = readPortfolioTagIndex({ projectRoot })
  const tagEntries = createPortfolioTagSeoEntries(tagIndex, { projectRoot, origin })
  const entries = [
    ...buildPortfolioSeoEntries(pages, { projectRoot, origin }),
    createSearchSeoEntry({ projectRoot, origin }),
    ...tagEntries,
  ]
  const manifest = createPortfolioSeoManifest(entries, { origin })
  const generatedDir = path.join(projectRoot, 'src', 'content', 'generated')
  const publicDir = path.join(projectRoot, 'public')
  mkdirSync(generatedDir, { recursive: true })
  mkdirSync(publicDir, { recursive: true })
  writeFileSync(path.join(generatedDir, 'portfolio-seo-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  writeFileSync(path.join(publicDir, 'sitemap.xml'), renderSitemapXml(entries, { origin }))
  writeFileSync(path.join(publicDir, 'robots.txt'), renderRobotsTxt({ origin }))
  return { manifest, entries }
}
