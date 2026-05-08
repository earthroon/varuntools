#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { readPages, routeForPage } from './lib/seo-pages.mjs'

const projectRoot = process.cwd()
const outputFile = path.join(projectRoot, 'public', 'search-index.json')

function isHiddenFromSearch(page) {
  const fm = page.frontmatter || {}
  const productStatus = fm.product?.status
  return (
    fm.draft === true ||
    fm.visibility === 'hidden' ||
    fm.status === 'archived' ||
    fm.status === 'draft' ||
    fm.robots === 'noindex,nofollow' ||
    productStatus === 'draft' ||
    productStatus === 'hidden'
  )
}

function normalizeTags(value) {
  return Array.isArray(value) ? value.filter((tag) => typeof tag === 'string' && tag.trim()).map((tag) => tag.trim()) : []
}

function toEntry(page) {
  const fm = page.frontmatter || {}
  const product = fm.product && typeof fm.product === 'object' ? fm.product : null
  const entry = {
    slug: page.slug,
    href: routeForPage(page),
    title: fm.title || page.slug,
    description: fm.summary || fm.description || '',
    kind: fm.kind || 'page',
    status: fm.status || 'active',
    visibility: fm.visibility || 'public',
    tags: normalizeTags(fm.tags),
    thumbnail: fm.cardCover || fm.thumbnail || fm.cover || fm.ogImage || '',
    order: typeof fm.order === 'number' ? fm.order : 9999,
    featured: fm.featured === true,
    updated: fm.updated || fm.releaseDate || fm.date || '',
  }

  if (product) {
    entry.product = {
      type: product.type || '',
      status: product.status || 'coming-soon',
      priceVisible: product.priceVisible !== false,
      currency: product.currency || 'KRW',
      category: product.category || '',
      subcategory: product.subcategory || '',
      series: product.series || fm.series || '',
      collection: product.collection || fm.collection || '',
    }
  }

  return entry
}

const entries = readPages({ projectRoot })
  .filter((page) => !isHiddenFromSearch(page))
  .map(toEntry)
  .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))

const payload = {
  version: 1,
  generatedAt: new Date().toISOString(),
  entries,
}

fs.mkdirSync(path.dirname(outputFile), { recursive: true })
fs.writeFileSync(outputFile, `${JSON.stringify(payload, null, 2)}\n`)
console.log(`[generate:search-index] wrote public/search-index.json with ${entries.length} entries`)
