import type { MarkdownFrontmatter } from '@/types/content'
import type { LegacyTransformReport } from './legacy/types'

export type ParsedMarkdownPage = {
  frontmatter: MarkdownFrontmatter
  content: string
}

export type MarkdownHeadingLevel = 1 | 2 | 3

export type MarkdownHeading = {
  id: string
  text: string
  level: MarkdownHeadingLevel
  order: number
}

export type RenderedMarkdownPage = {
  html: string
  headings: MarkdownHeading[]
}

export type LoadedMarkdownPage = {
  slug: string
  contentDir: string
  html: string
  raw: string
  frontmatter: MarkdownFrontmatter
  headings: MarkdownHeading[]
  legacyTransforms: LegacyTransformReport
}
