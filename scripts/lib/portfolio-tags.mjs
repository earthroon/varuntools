import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { readPortfolioPages, routeForPage, isIndexablePortfolioPage, joinUrl, DEFAULT_SITE } from './portfolio-seo.mjs'

export const PORTFOLIO_TAG_INDEX_VERSION = 1

function asString(value = '') {
  return String(value ?? '').trim()
}

function asArray(value) {
  if (Array.isArray(value)) return value.flatMap((item) => asArray(item))
  if (value && typeof value === 'object') return Object.values(value).flatMap((item) => asArray(item))
  const text = asString(value)
  if (!text) return []
  return text.split(/[|,]/).map((item) => item.trim()).filter(Boolean)
}

function unique(values) {
  return Array.from(new Set(values.map((item) => asString(item)).filter(Boolean)))
}

function workObject(page = {}) {
  const work = page.frontmatter?.work
  return work && typeof work === 'object' && !Array.isArray(work) ? work : {}
}

export function normalizePortfolioTag(value) {
  return asString(value).normalize('NFKC').replace(/\s+/g, ' ').trim()
}

export function createPortfolioTagSlug(tag) {
  return normalizePortfolioTag(tag)
    .toLowerCase()
    .replace(/[\\/?:#\[\]@!$&'()*+,;=]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function isPortfolioWorkPage(page = {}) {
  const fm = page.frontmatter || {}
  const work = workObject(page)
  const kind = asString(fm.kind).toLowerCase()
  const slug = asString(page.slug)
  if (slug === 'works') return false
  return Boolean(Object.keys(work).length) || kind === 'work' || slug.startsWith('works/')
}

export function isTagIndexableWork(page = {}) {
  if (!page || !isPortfolioWorkPage(page)) return false
  if (!isIndexablePortfolioPage(page)) return false
  const fm = page.frontmatter || {}
  const work = workObject(page)
  const status = asString(work.status || fm.status || '').toLowerCase()
  const visibility = asString(work.visibility || fm.visibility || '').toLowerCase()
  if (status === 'draft' || status === 'private' || status === 'hidden') return false
  if (visibility === 'hidden' || visibility === 'private') return false
  return true
}

export function tagsForWorkPage(page = {}) {
  const fm = page.frontmatter || {}
  const work = workObject(page)
  return unique([...asArray(work.tags), ...asArray(fm.tags)]).map(normalizePortfolioTag).filter(Boolean)
}

function titleForTag(tag) {
  return `${tag} 작업`
}

function descriptionForTag(tag, count) {
  return `${tag} 태그가 붙은 포트폴리오 작업 ${count}개입니다.`
}

export function buildPortfolioTagEntries(pages = [], context = {}) {
  const groups = new Map()

  for (const page of pages) {
    if (!isTagIndexableWork(page)) continue
    const tags = tagsForWorkPage(page)
    if (!tags.length) continue
    for (const tag of tags) {
      const slug = createPortfolioTagSlug(tag)
      if (!slug) continue
      const current = groups.get(slug) || { tag, slug, works: [] }
      current.tag = current.tag || tag
      current.works.push(page.slug)
      groups.set(slug, current)
    }
  }

  return [...groups.values()]
    .map((entry) => {
      const works = unique(entry.works).sort()
      const count = works.length
      return {
        tag: entry.tag,
        slug: entry.slug,
        href: `/works/tags/${entry.slug}`,
        count,
        works,
        title: titleForTag(entry.tag),
        description: descriptionForTag(entry.tag, count),
        indexable: count > 0,
      }
    })
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
}

export function createPortfolioTagIndex(entries = [], context = {}) {
  const indexable = entries.filter((entry) => entry.indexable && entry.count > 0)
  return {
    version: PORTFOLIO_TAG_INDEX_VERSION,
    generatedAt: new Date().toISOString(),
    tags: indexable,
    summary: {
      totalTags: indexable.length,
      totalTaggedWorks: new Set(indexable.flatMap((entry) => entry.works)).size,
      emptyTags: entries.length - indexable.length,
    },
  }
}

export function readPortfolioTagIndex(options = {}) {
  const projectRoot = options.projectRoot || process.cwd()
  const indexPath = options.indexPath || path.join(projectRoot, 'src', 'content', 'generated', 'portfolio-tag-index.json')
  if (!existsSync(indexPath)) return null
  try {
    return JSON.parse(readFileSync(indexPath, 'utf8'))
  } catch {
    return null
  }
}

export function createPortfolioTagSeoEntries(tagIndex, context = {}) {
  const origin = context.origin || DEFAULT_SITE.origin
  return (tagIndex?.tags || [])
    .filter((entry) => entry.indexable && entry.count > 0)
    .map((entry) => ({
      slug: `works/tags/${entry.slug}`,
      href: entry.href,
      canonicalUrl: joinUrl(origin, entry.href),
      title: `${entry.title} | ${DEFAULT_SITE.defaultTitle}`,
      description: entry.description,
      image: joinUrl(origin, DEFAULT_SITE.defaultImage),
      imageExists: false,
      type: 'tag',
      status: 'published',
      indexable: true,
      noindexReason: '',
      sourcePath: 'src/content/generated/portfolio-tag-index.json',
      lastmod: '',
      warningCodes: [],
    }))
}

export function buildAndWritePortfolioTagIndex(options = {}) {
  const projectRoot = options.projectRoot || process.cwd()
  const pages = options.pages || readPortfolioPages({ projectRoot })
  const entries = buildPortfolioTagEntries(pages, options)
  const index = createPortfolioTagIndex(entries, options)
  const generatedDir = path.join(projectRoot, 'src', 'content', 'generated')
  mkdirSync(generatedDir, { recursive: true })
  const outPath = path.join(generatedDir, 'portfolio-tag-index.json')
  writeFileSync(outPath, `${JSON.stringify(index, null, 2)}\n`)
  return { index, entries, outPath }
}
