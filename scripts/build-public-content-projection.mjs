#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import {
  CMS207M_R1_CONTENT_PROJECTION_SCHEMA,
  listIndexMarkdown,
  loadVacmsProjectionSidecars,
  normalizeSlash,
  parseFrontmatter,
  readArray,
  readBoolean,
  readJson,
  readNumber,
  readObject,
  readString,
  readTime,
  stableJson,
  trimSlashes,
} from './lib/cms207m-public-projection.mjs'

const ROOT = process.cwd()
const CONTENT_ROOT = path.join(ROOT, 'src', 'content', 'pages')
const SIDECAR_ROOT = path.join(ROOT, 'src', 'content', 'generated', 'vacms-pages')
const OUT_FILE = path.join(ROOT, 'src', 'content', 'generated', 'publicContentProjection.generated.json')
const TAXONOMY_FILE = path.join(ROOT, 'config', 'public-content-taxonomy.json')
const CHECK = process.argv.includes('--check')

function inferCategory(frontmatter, contentDir) {
  const exposure = readObject(frontmatter.exposure)
  const direct = readString(frontmatter.category)
    || readString(frontmatter.kind)
    || readString(frontmatter.type)
    || readString(exposure.category)
    || readString(exposure.kind)
  if (direct) return direct
  if (contentDir.startsWith('works/') || contentDir === 'works') return 'work'
  if (contentDir.startsWith('posts/') || contentDir.startsWith('post/')) return 'post'
  if (contentDir.startsWith('lab/')) return 'lab'
  if (contentDir.startsWith('tools/')) return 'tool'
  if (contentDir.startsWith('docs/')) return 'doc'
  return 'page'
}

function hrefOf(slug) {
  return slug === 'home' ? '/' : `/${slug}`
}

function extractReferencedAssetIds(raw) {
  const found = new Set()
  const pattern = /(?:^|\n)\s*(?:videoAssetId|assetId):\s*["']?([A-Za-z0-9._:-]+)["']?\s*(?:$|\n)/g
  let match
  while ((match = pattern.exec(raw))) {
    const assetId = String(match[1] || '').trim()
    if (assetId) found.add(assetId)
  }
  return [...found]
}

function extractYear(time, ...values) {
  if (Number.isFinite(time) && time > 0) return new Date(time).getUTCFullYear()
  for (const value of values) {
    const match = String(value || '').match(/(?:19|20)\d{2}/)
    if (match) return Number(match[0])
  }
  return undefined
}

const taxonomy = readJson(TAXONOMY_FILE, {}) || {}
const labels = taxonomy.labels && typeof taxonomy.labels === 'object' ? taxonomy.labels : {}
const sidecars = loadVacmsProjectionSidecars(SIDECAR_ROOT)
let legacyVacmsUnprojectedCount = 0

const entries = listIndexMarkdown(CONTENT_ROOT).map((file) => {
  const raw = fs.readFileSync(file, 'utf8')
  const frontmatter = parseFrontmatter(raw)
  const contentDir = normalizeSlash(path.relative(CONTENT_ROOT, path.dirname(file)))
  const exposure = readObject(frontmatter.exposure)
  const work = readObject(frontmatter.work)
  const slug = trimSlashes(frontmatter.slug || contentDir)
  const category = inferCategory(frontmatter, contentDir)
  const kind = readString(frontmatter.kind) || readString(frontmatter.type) || category
  const collection = readString(frontmatter.collection) || readString(exposure.collection) || kind
  const source = readString(frontmatter.source) || 'repository'
  const pageId = readString(frontmatter.vacmsPageId)
  const revisionId = readString(frontmatter.vacmsRevisionId)
  const projectionSchema = readString(frontmatter.vacmsProjectionSchema)
  const sidecar = source === 'vacms' && pageId ? sidecars.get(pageId) : null

  if (source === 'vacms' && projectionSchema === 'vacms-public-projection@1' && !sidecar) {
    throw new Error(`E_CMS207M_VACMS_PROJECTION_MISSING:${pageId || slug}`)
  }

  let projectionState = source === 'vacms' ? 'legacy_unprojected' : 'repository'
  let sidecarTiming = null
  if (source === 'vacms' && sidecar) {
    const projectedRevisionId = readString(sidecar.payload.page?.revisionId)
    if (revisionId && projectedRevisionId && revisionId !== projectedRevisionId) {
      throw new Error(`E_CMS207M_PROJECTION_REVISION_MISMATCH:${pageId}:${revisionId}:${projectedRevisionId}`)
    }
    const projectedAssetIds = new Set(
      (Array.isArray(sidecar.payload.assets) ? sidecar.payload.assets : [])
        .map((asset) => readString(asset?.assetId))
        .filter(Boolean),
    )
    for (const referencedAssetId of extractReferencedAssetIds(raw)) {
      if (!projectedAssetIds.has(referencedAssetId)) {
        throw new Error(`E_CMS207M_REFERENCED_ASSET_PROJECTION_MISSING:${pageId}:${referencedAssetId}`)
      }
    }
    projectionState = 'vacms_projected'
    sidecarTiming = sidecar.payload.page?.timing ?? null
  } else if (source === 'vacms') {
    legacyVacmsUnprojectedCount += 1
  }

  const time = projectionState === 'vacms_projected'
    ? readTime(
        sidecarTiming?.explicitPublishedAt,
        sidecarTiming?.revisionCreatedAt,
        frontmatter.publishedDate,
        frontmatter.date,
        frontmatter.updated,
        frontmatter.created,
      )
    : readTime(
        frontmatter.publishedDate,
        frontmatter.date,
        frontmatter.updated,
        frontmatter.created,
        slug,
      )

  const title = readString(frontmatter.cardTitle) || readString(frontmatter.title) || slug
  const description = readString(frontmatter.cardDescription)
    || readString(frontmatter.summary)
    || readString(frontmatter.description)
  const cover = readString(frontmatter.cardCover)
    || readString(frontmatter.thumbnail)
    || readString(frontmatter.cover)
    || readString(frontmatter.ogImage)
  const status = readString(exposure.status) || readString(frontmatter.status) || 'active'
  const visibility = readString(exposure.visibility) || readString(frontmatter.visibility) || 'public'
  const hasWorkMetadata = Object.keys(work).length > 0
    || category === 'work'
    || category === 'case-study'
    || kind === 'work'
    || kind === 'case-study'
  const year = extractYear(time, frontmatter.publishedDate, frontmatter.date, frontmatter.updated, slug)

  return {
    slug,
    href: hrefOf(slug),
    contentDir,
    title,
    description,
    category,
    categoryLabel: readString(frontmatter.categoryLabel) || labels[category] || category,
    kind,
    collection,
    tags: readArray(frontmatter.tags),
    order: readNumber(frontmatter.order, 9999),
    featured: readBoolean(frontmatter.featured) || readBoolean(exposure.featured) || readBoolean(work.featured),
    visibility,
    status,
    cover,
    thumbnail: readString(frontmatter.thumbnail) || cover,
    ...(year ? { year } : {}),
    time,
    source,
    sourcePath: normalizeSlash(path.relative(ROOT, file)),
    projectionState,
    ...(pageId ? { vacmsPageId: pageId } : {}),
    ...(revisionId ? { vacmsRevisionId: revisionId } : {}),
    work: {
      hasWorkMetadata,
      status: readString(work.status) || status,
      role: readArray(work.role ?? frontmatter.role),
      stack: readArray(work.stack ?? frontmatter.stack),
      period: readString(work.period) || readString(frontmatter.period),
      type: readString(work.type) || kind,
    },
  }
}).filter((entry) => entry.slug)
  .sort((a, b) => a.slug.localeCompare(b.slug))

const payload = {
  schemaVersion: CMS207M_R1_CONTENT_PROJECTION_SCHEMA,
  projectionRevision: 'CMS-207M-R1',
  legacyVacmsUnprojectedCount,
  entries,
}

const next = stableJson(payload)
if (CHECK) {
  const current = fs.existsSync(OUT_FILE) ? fs.readFileSync(OUT_FILE, 'utf8') : ''
  if (current !== next) {
    console.error('E_CMS207M_PUBLIC_CONTENT_PROJECTION_STALE')
    process.exit(1)
  }
  console.log('PASS_CMS_207M_R1_PUBLIC_CONTENT_PROJECTION_CHECK')
} else {
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true })
  fs.writeFileSync(OUT_FILE, next, 'utf8')
  console.log('PASS_CMS_207M_R1_PUBLIC_CONTENT_PROJECTION_BUILD')
  console.log(`entryCount=${entries.length}`)
  console.log(`legacyVacmsUnprojectedCount=${legacyVacmsUnprojectedCount}`)
}
