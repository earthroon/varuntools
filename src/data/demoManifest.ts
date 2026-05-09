import rawDemoManifest from './demoManifest.json'

export type DemoStatus = 'stable' | 'experimental' | 'archived'

export type DemoManifestEntry = {
  id: string
  title: string
  src: string
  ratio?: string
  status?: DemoStatus
  description?: string
  stack?: string[]
  allowFullscreen?: boolean
  sandbox?: string
  autoResize?: boolean
  minHeight?: number
  maxHeight?: number
  externalUrl?: string
}

export const demoManifest = rawDemoManifest as DemoManifestEntry[]

export const demoManifestById = new Map(demoManifest.map((entry) => [entry.id, entry]))

export function findDemoManifestEntry(id: string | undefined): DemoManifestEntry | undefined {
  const key = String(id || '').trim()
  return key ? demoManifestById.get(key) : undefined
}

export function resolveDemoSource(src: string): string {
  const value = String(src || '').trim()
  if (!value) return ''
  if (/^(?:https?:)?\/\//i.test(value)) return value

  const base = import.meta.env.BASE_URL || '/'
  const normalizedBase = base.endsWith('/') ? base : `${base}/`
  return `${normalizedBase}${value.replace(/^\/+/, '')}`
}
