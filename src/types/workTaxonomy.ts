export type WorkCategory =
  | 'design'
  | 'tool'
  | 'system'
  | 'writing'
  | 'commerce'
  | 'experiment'

export type WorkRole =
  | 'designer'
  | 'developer'
  | 'system-architect'
  | 'writer'
  | 'editor'
  | 'automation-planner'

export type WorkStack =
  | 'typescript'
  | 'vue'
  | 'vite'
  | 'cloudflare'
  | 'webgpu'
  | 'google-sheets'
  | 'appsheet'
  | 'markdown'
  | 'notion'
  | 'css'

export type WorkTaxonomyToken = WorkCategory | WorkRole | WorkStack | string

export type WorkTaxonomyOption<TValue extends string = string> = {
  value: TValue
  label: string
  description?: string
}

export type WorkFilterState = {
  category?: WorkTaxonomyToken | 'all'
  role?: WorkTaxonomyToken | 'all'
  stack?: WorkTaxonomyToken | 'all'
  tag?: string | 'all'
  featuredOnly?: boolean
}

export type WorkTaxonomyRecord = {
  categories: string[]
  roles: string[]
  stack: string[]
  tags: string[]
  featured: boolean
}
