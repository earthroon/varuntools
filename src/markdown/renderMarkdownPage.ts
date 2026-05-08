import { createMarkdownRenderer } from './createMarkdownRenderer'
import { createUniqueHeadingId } from './slugifyHeading'
import type {
  MarkdownHeading,
  MarkdownHeadingLevel,
  RenderedMarkdownPage,
} from './types'

function stripInlineHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

export function renderMarkdownPage(content: string, contentDir = ''): RenderedMarkdownPage {
  const md = createMarkdownRenderer()
  const headings: MarkdownHeading[] = []
  const usedIds = new Map<string, number>()

  const defaultHeadingOpen =
    md.renderer.rules.heading_open ||
    ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))

  md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const nextToken = tokens[idx + 1]
    const level = Number(token.tag.replace('h', '')) as MarkdownHeadingLevel

    if (level < 1 || level > 3) {
      return defaultHeadingOpen(tokens, idx, options, env, self)
    }

    const rawText = nextToken?.content || ''
    const text = stripInlineHtml(rawText)
    const id = createUniqueHeadingId(text, usedIds)

    token.attrSet('id', id)

    headings.push({
      id,
      text,
      level,
      order: headings.length,
    })

    return defaultHeadingOpen(tokens, idx, options, env, self)
  }

  return {
    html: md.render(content, { contentDir }),
    headings,
  }
}
