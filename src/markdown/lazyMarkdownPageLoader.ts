import { markdownRouteIndexEntries, type MarkdownRouteIndexEntry } from './markdownRouteIndex.generated'
import { loadMarkdownPageFromSource } from './loadMarkdownPageFromSource'
import { normalizeSlugString } from './pageLookup'
import type { LoadedMarkdownPage } from './types'
import { vacmsLiveMarkdownPageSources } from './vacmsLivePages.generated'

const markdownModules = import.meta.glob<string>('../content/pages/**/index.md', {
  query: '?raw',
  import: 'default',
})

const pageCache = new Map<string, LoadedMarkdownPage>()
const pendingLoads = new Map<string, Promise<LoadedMarkdownPage | null>>()

function contentPathFor(contentDir: string): string {
  return `../content/pages/${contentDir}/index.md`
}

function findRouteIndexEntry(rawSlug: string): MarkdownRouteIndexEntry | null {
  const slug = normalizeSlugString(rawSlug)
  if (!slug) return null

  const direct = markdownRouteIndexEntries.find((entry) => entry.slug === slug)
  if (direct) return direct

  const byContentDir = markdownRouteIndexEntries.find((entry) => entry.contentDir === slug)
  return byContentDir || null
}

function readLiveEntrySlug(entry: Record<string, unknown>): string {
  const contentDir = String(entry.contentDir || '').trim()
  const materializedSlug = String(entry.materializedSlug || '').trim()
  const raw = String(entry.raw || '')
  const normalized = raw.replace(/^\uFEFF/, '')

  if (normalized.startsWith('---')) {
    const end = normalized.indexOf('\n---', 3)
    const frontmatter = end >= 0 ? normalized.slice(3, end) : ''
    const match = frontmatter.match(/^slug:\s*['"]?([^'"\r\n#]+)['"]?\s*$/m)
    const slug = normalizeSlugString(match?.[1] || '')
    if (slug) return slug
  }

  return normalizeSlugString(materializedSlug || contentDir)
}

function findLiveSource(rawSlug: string, contentDir = ''): Record<string, unknown> | null {
  const slug = normalizeSlugString(rawSlug)
  const normalizedContentDir = normalizeSlugString(contentDir)

  for (const entry of vacmsLiveMarkdownPageSources as unknown as Record<string, unknown>[]) {
    const entryContentDir = normalizeSlugString(String(entry.contentDir || ''))
    const materializedSlug = normalizeSlugString(String(entry.materializedSlug || ''))
    const entrySlug = readLiveEntrySlug(entry)

    if (
      entrySlug === slug ||
      entryContentDir === slug ||
      materializedSlug === slug ||
      (normalizedContentDir && entryContentDir === normalizedContentDir) ||
      (normalizedContentDir && materializedSlug === normalizedContentDir)
    ) {
      return entry
    }
  }

  return null
}

function loadLivePage(entry: Record<string, unknown>): LoadedMarkdownPage | null {
  const raw = String(entry.raw || '')
  if (!raw.trim()) return null

  const contentDir = String(entry.contentDir || entry.materializedSlug || '').trim()
  if (!contentDir) return null

  return loadMarkdownPageFromSource(raw, contentDir)
}

async function loadContentPage(contentDir: string): Promise<LoadedMarkdownPage | null> {
  const loader = markdownModules[contentPathFor(contentDir)]
  if (!loader) return null

  const raw = await loader()
  return loadMarkdownPageFromSource(String(raw || ''), contentDir)
}

async function resolveMarkdownPageBySlug(rawSlug: string): Promise<LoadedMarkdownPage | null> {
  const slug = normalizeSlugString(rawSlug)
  if (!slug) return null

  const liveEntry = findLiveSource(slug)
  if (liveEntry) {
    const livePage = loadLivePage(liveEntry)
    if (livePage) return livePage
  }

  const routeEntry = findRouteIndexEntry(slug)
  if (!routeEntry) {
    return loadContentPage(slug)
  }

  if (routeEntry.source === 'vacms-live') {
    const live = findLiveSource(routeEntry.slug, routeEntry.contentDir)
    if (live) return loadLivePage(live)
  }

  return loadContentPage(routeEntry.contentDir)
}

function rememberPageAliases(slug: string, loaded: LoadedMarkdownPage): void {
  const pageSlug = normalizeSlugString(loaded.slug)
  if (pageSlug && pageSlug !== slug) pageCache.set(pageSlug, loaded)

  const contentDir = normalizeSlugString(loaded.contentDir)
  if (contentDir && contentDir !== slug) pageCache.set(contentDir, loaded)
}

export async function loadMarkdownPageBySlug(rawSlug: string): Promise<LoadedMarkdownPage | null> {
  const slug = normalizeSlugString(rawSlug)
  if (!slug) return null

  const cached = pageCache.get(slug)
  if (cached) return cached

  const pending = pendingLoads.get(slug)
  if (pending) return pending

  const pendingLoad = resolveMarkdownPageBySlug(slug)
    .then((loaded) => {
      if (loaded) pageCache.set(slug, loaded)
      if (loaded) rememberPageAliases(slug, loaded)
      return loaded
    })
    .finally(() => {
      pendingLoads.delete(slug)
    })

  pendingLoads.set(slug, pendingLoad)
  return pendingLoad
}

export function prefetchMarkdownPageBySlug(rawSlug: string): Promise<LoadedMarkdownPage | null> {
  return loadMarkdownPageBySlug(rawSlug).catch(() => null)
}

export function clearMarkdownPageLoaderCache(): void {
  pageCache.clear()
  pendingLoads.clear()
}

export function readMarkdownPageLoaderCacheStats(): { cached: number; pending: number } {
  return {
    cached: pageCache.size,
    pending: pendingLoads.size,
  }
}
