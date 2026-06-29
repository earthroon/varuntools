import { loadMarkdownPageFromSource } from './loadMarkdownPageFromSource'
import type { LoadedMarkdownPage } from './types'
import { vacmsLiveMarkdownPageSources } from './vacmsLivePages.generated'

const modules = import.meta.glob('../content/pages/**/index.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

function contentDirFromPath(path: string): string {
  return path
    .replace('../content/pages/', '')
    .replace('/index.md', '')
}

export function loadMarkdownPages(): LoadedMarkdownPage[] {
  const globPages = Object.entries(modules).map(([path, raw]) => {
    const source = String(raw)
    const contentDir = contentDirFromPath(path)
    return loadMarkdownPageFromSource(source, contentDir)
  })

  const livePages = vacmsLiveMarkdownPageSources
    .filter((entry) => String(entry.raw || '').trim())
    .map((entry) => loadMarkdownPageFromSource(
      String(entry.raw || ''),
      entry.contentDir || entry.materializedSlug,
    ))

  const merged = new Map<string, LoadedMarkdownPage>()

  for (const page of globPages) {
    merged.set(page.contentDir, page)
  }

  for (const page of livePages) {
    merged.set(page.contentDir, page)
  }

  return [...merged.values()]
}
