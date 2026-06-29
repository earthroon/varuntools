import { applyLegacyMarkdownAdapters } from './legacy'
import { parseFrontmatter } from './parseFrontmatter'
import { renderMarkdownPage } from './renderMarkdownPage'
import type { LoadedMarkdownPage } from './types'

export function loadMarkdownPageFromSource(
  source: string,
  contentDir: string,
): LoadedMarkdownPage {
  const parsed = parseFrontmatter(source)
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
}
