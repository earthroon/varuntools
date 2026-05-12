import type { WorkCardEntry, WorkLinks, WorkMood, WorkType, WorkStatus } from '@/markdown/pageRegistry'
import type { GeneratedPage } from '@/types/generatedContent'
import { getGeneratedPageContentDir } from './resolveGeneratedAssetSrc'

function readYear(page: GeneratedPage): number | undefined {
  const match = [page.title, page.desc, page.slug].join(' ').match(/(?:19|20)\d{2}/)
  if (!match) return undefined
  const parsed = Number(match[0])
  return Number.isFinite(parsed) ? parsed : undefined
}

export function toGeneratedWorkCardEntry(page: GeneratedPage): WorkCardEntry {
  const cover = page.cover?.src || ''
  const type = (page.template || page.type || 'work') as WorkType
  const workStatus = 'published' as WorkStatus
  const mood: WorkMood = {}
  const links: WorkLinks = {}

  return {
    slug: page.slug,
    href: `/${page.slug}`,
    title: page.title,
    description: page.desc || '',
    summary: page.desc || '',
    cover,
    thumbnail: cover,
    icon: '',
    kind: page.type === 'work' ? 'work' : page.type,
    type,
    status: 'active',
    workStatus,
    tags: page.tags || [],
    order: page.order,
    featured: page.featured,
    weight: page.featured ? 80 : 0,
    contentDir: getGeneratedPageContentDir(page),

    year: readYear(page),
    period: '',
    client: '',
    role: [],
    stack: [],
    tools: [],
    category: page.type,
    mood,
    links,
    hasWorkMetadata: page.type === 'work' || page.featured,

    date: '',
    updated: '',
    series: '',
    related: [],
    visibility: 'public',
  }
}

export function getGeneratedWorkCardEntries(pages: GeneratedPage[]): WorkCardEntry[] {
  return pages
    .filter((page) => page.type === 'work' || page.featured)
    .map(toGeneratedWorkCardEntry)
}
