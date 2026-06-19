#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import process from 'node:process'

const root = process.cwd()
const objectLeakToken = '[' + 'object Object' + ']'
const SITE_BASE_URL = (process.env.SITE_BASE_URL || 'https://varun.tools').replace(/\/$/, '')

function fullPath(relativePath) {
  return path.join(root, relativePath)
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(fullPath(relativePath), 'utf8'))
}

function ensureDir(relativePath) {
  fs.mkdirSync(fullPath(relativePath), { recursive: true })
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function isInternalPreviewPage(page) {
  const haystack = `${page.source || ''} ${page.routePath || ''} ${page.slug || ''}`.toLowerCase()
  return haystack.includes('editorial-showcase') || haystack.includes('visual-qa')
}

function isDummyOrPlaygroundPage(page) {
  const haystack = `${page.source || ''} ${page.routePath || ''} ${page.slug || ''}`.toLowerCase()
  return /dummy|playground|spec/.test(haystack)
}

function shouldIncludeInSitemap(page) {
  if (page.visibility && page.visibility !== 'public') return false
  if (page.status && page.status !== 'active') return false
  if (page.noindex) return false
  if (page.section === 'checkout') return false
  if (page.section === 'qa') return false
  if (isInternalPreviewPage(page)) return false
  if (isDummyOrPlaygroundPage(page)) return false
  return true
}

function toAbsoluteUrl(routePath) {
  const normalizedPath = routePath === '/' ? '/' : `/${String(routePath || '').replace(/^\/+/, '').replace(/\/+$/, '')}`
  return normalizedPath === '/' ? `${SITE_BASE_URL}/` : `${SITE_BASE_URL}${normalizedPath}`
}

function generateSitemapXml(pages) {
  const urls = pages
    .filter(shouldIncludeInSitemap)
    .map((page) => ({ loc: toAbsoluteUrl(page.routePath), source: page.source, routePath: page.routePath }))
    .sort((a, b) => a.loc.localeCompare(b.loc))

  const markdownGalleryPage = pages.find((page) => {
    const haystack = `${page.source || ''} ${page.routePath || ''} ${page.slug || ''}`.toLowerCase()
    return shouldIncludeInSitemap(page) && haystack.includes('lab-markdown-gallery')
  })
  const markdownGalleryAlias = toAbsoluteUrl('/lab/markdown-gallery')
  if (markdownGalleryPage && !urls.some((url) => url.loc === markdownGalleryAlias)) {
    urls.push({
      loc: markdownGalleryAlias,
      source: markdownGalleryPage.source,
      routePath: '/lab/markdown-gallery',
    })
    urls.sort((a, b) => a.loc.localeCompare(b.loc))
  }

  const forbidden = [
    '/works/editorial-showcase',
    '/products/dummy-catalog',
    '/products/spec-playground',
    '/checkout/success',
    '/checkout/fail',
    '/qa/ewa-gallery',
    '/claim',
  ]
  const locs = urls.map((url) => url.loc)
  for (const route of forbidden) {
    const absolute = toAbsoluteUrl(route)
    if (locs.includes(absolute)) {
      throw new Error(`Forbidden route leaked into sitemap output: ${route}`)
    }
  }

  const body = urls
    .map((url) => ['  <url>', `    <loc>${escapeXml(url.loc)}</loc>`, '  </url>'].join('\n'))
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
  if (xml.includes(objectLeakToken)) throw new Error('Object serialization leak detected in sitemap output.')
  return { xml, urls }
}

if (!fs.existsSync(fullPath('generated/page-inventory.json'))) {
  const result = spawnSync('node', ['scripts/generate-content-page-inventory.mjs'], {
    cwd: root,
    stdio: 'inherit',
  })
  if (result.status !== 0) process.exit(result.status || 1)
}

const inventory = readJson('generated/page-inventory.json')
const { xml, urls } = generateSitemapXml(inventory.pages || [])

ensureDir('generated')
ensureDir('dist')
fs.writeFileSync(fullPath('generated/sitemap.xml'), xml)
fs.writeFileSync(fullPath('dist/sitemap.xml'), xml)

console.log(`[sitemap] wrote ${urls.length} urls to generated/sitemap.xml`)
console.log('[sitemap] mirrored output to dist/sitemap.xml for existing release smoke')
