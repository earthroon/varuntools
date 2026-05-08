import type { LoadedMarkdownPage } from '@/markdown/types'
import {
  getReservedRoutePaths,
  isReservedRoute,
  normalizeRoutePath,
} from './reservedRoutes'

export type RouteManifestIssueKind =
  | 'duplicate-slug'
  | 'reserved-slug-conflict'
  | 'empty-slug'

export type RouteManifestIssue = {
  kind: RouteManifestIssueKind
  slug: string
  message: string
  pages?: string[]
}

export type RouteManifest = {
  markdownSlugs: string[]
  reservedPaths: string[]
  issues: RouteManifestIssue[]
}

export function createRouteManifest(pages: LoadedMarkdownPage[]): RouteManifest {
  const slugMap = new Map<string, string[]>()
  const issues: RouteManifestIssue[] = []

  for (const page of pages) {
    const slug = normalizeRoutePath(page.slug)

    if (!slug) {
      issues.push({
        kind: 'empty-slug',
        slug,
        message: 'Markdown page has an empty slug.',
        pages: [page.contentDir],
      })
      continue
    }

    const list = slugMap.get(slug) || []
    list.push(page.contentDir)
    slugMap.set(slug, list)

    if (isReservedRoute(slug)) {
      issues.push({
        kind: 'reserved-slug-conflict',
        slug,
        message: `Markdown slug conflicts with reserved route: ${slug}`,
        pages: [page.contentDir],
      })
    }
  }

  for (const [slug, dirs] of slugMap.entries()) {
    if (dirs.length > 1) {
      issues.push({
        kind: 'duplicate-slug',
        slug,
        message: `Duplicate Markdown slug: ${slug}`,
        pages: dirs,
      })
    }
  }

  return {
    markdownSlugs: [...slugMap.keys()].sort(),
    reservedPaths: getReservedRoutePaths(),
    issues,
  }
}

let didLogRouteManifestIssues = false

export function logRouteManifestIssues(manifest: RouteManifest): void {
  if (!import.meta.env.DEV) return
  if (!manifest.issues.length) return
  if (didLogRouteManifestIssues) return

  didLogRouteManifestIssues = true
  console.warn('[VARUNTOOLS][route-manifest]', manifest.issues)
}
