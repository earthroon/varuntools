import { applyLegacyMarkdownAdapters } from './legacy'
import { parseFrontmatter } from './parseFrontmatter'
import { renderMarkdownPage } from './renderMarkdownPage'
import type { LoadedMarkdownPage } from './types'

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
  return Object.entries(modules).map(([path, raw]) => {
    const source = String(raw)
    const parsed = parseFrontmatter(source)
    const contentDir = contentDirFromPath(path)
    const slug = parsed.frontmatter.slug || contentDir
    const legacy = applyLegacyMarkdownAdapters(parsed.content)
    const rendered = renderMarkdownPage(legacy.content, contentDir)

    return {
      slug,
      contentDir,
      raw: source,
      frontmatter: parsed.frontmatter,
      html: rendered.html,
      headings: rendered.headings,
      legacyTransforms: legacy.report,
    }
  })
}
