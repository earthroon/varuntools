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
  category?: WorkCategory | 'all'
  role?: WorkRole | 'all'
  stack?: WorkStack | 'all'
  tag?: string | 'all'
  featuredOnly?: boolean
}

export type WorkTaxonomyRecord = {
  categories: WorkCategory[]
  roles: WorkRole[]
  stack: WorkStack[]
  tags: string[]
  featured: boolean
}
