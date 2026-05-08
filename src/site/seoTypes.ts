export type SeoRobotsDirective = 'index' | 'noindex' | 'follow' | 'nofollow'

export type OpenGraphType = 'website' | 'article' | 'product'

export type RouteSeoOpenGraph = {
  title?: string
  description?: string
  image?: string
  type?: OpenGraphType
}

export type RouteSeoMeta = {
  route: string
  title: string
  description: string
  canonical?: string
  robots?: SeoRobotsDirective[]
  og?: RouteSeoOpenGraph
}

export type RouteSeoManifest = Record<string, RouteSeoMeta>
