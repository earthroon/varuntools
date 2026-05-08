export type SearchIndexProduct = {
  type?: string
  status?: string
  priceVisible?: boolean
  currency?: string
  category?: string
  subcategory?: string
  series?: string
  collection?: string
}

export type SearchIndexEntry = {
  slug: string
  href: string
  title: string
  description: string
  kind: string
  status: string
  visibility: string
  tags: string[]
  thumbnail: string
  order: number
  featured: boolean
  updated: string
  product?: SearchIndexProduct
}

export type SearchIndexDocument = {
  version: 1
  generatedAt: string
  entries: SearchIndexEntry[]
}
