export type GeneratedPageType =
  | 'page'
  | 'work'
  | 'commission'
  | 'product'
  | 'catalog'
  | 'doc'
  | 'lab'
  | 'tool'
  | 'post'
  | 'case-study'

export type GeneratedAssetType = 'image' | 'video' | 'file' | 'embed'

export type GeneratedAssetRef = {
  assetId: string
  src: string
  type: GeneratedAssetType
  role?: string
  alt?: string
  caption?: string
  mimeType?: string
  pageId?: string
  pageType?: GeneratedPageType | string
  pageFolder?: string
  repoPath?: string
  external?: boolean
  assetMode?: string
}

export type TextBlock = {
  id: string
  kind: 'text'
  order: number
  title?: string
  body: string
}

export type CalloutBlock = {
  id: string
  kind: 'callout'
  order: number
  type: 'note' | 'tip' | 'warning' | 'danger' | 'ssot' | 'decision' | 'quote'
  tone?: string
  title?: string
  body: string
  collapsible: boolean
  defaultOpen: boolean
}

export type CompareBlock = {
  id: string
  kind: 'compare'
  order: number
  title?: string
  before: GeneratedAssetRef
  after: GeneratedAssetRef
  initial: number
  caption?: string
  labels?: boolean
}

export type ImageBlock = {
  id: string
  kind: 'image'
  order: number
  title?: string
  image: GeneratedAssetRef
  caption?: string
}

export type CtaBlock = {
  id: string
  kind: 'cta'
  order: number
  title?: string
  body?: string
  buttonLabel: string
  buttonUrl: string
  variant?: 'primary' | 'secondary' | 'ghost'
}

export type FaqBlock = {
  id: string
  kind: 'faq'
  order: number
  question: string
  answer: string
}

export type GeneratedBlock =
  | TextBlock
  | CalloutBlock
  | CompareBlock
  | ImageBlock
  | CtaBlock
  | FaqBlock

export type GeneratedPage = {
  id: string
  slug: string
  type: GeneratedPageType
  title: string
  desc?: string
  template: string
  tags: string[]
  featured: boolean
  order: number
  folder?: string
  contentDir?: string
  contentPath?: string
  cover?: GeneratedAssetRef
  blocks: GeneratedBlock[]
}

export type GeneratedPagesFile = {
  generatedAt: string
  source: string
  schemaVersion: string
  pages: GeneratedPage[]
}

export type GeneratedAssetsFile = {
  generatedAt: string
  source: string
  schemaVersion: string
  assets: GeneratedAssetRef[]
}

export type GeneratedSettingsFile = {
  generatedAt: string
  source: string
  schemaVersion: string
  settings: Record<string, unknown>
}
