export type MediaAssetKind =
  | 'local'
  | 'external'
  | 'content_asset'
  | 'public'
  | 'data'
  | 'missing'
  | 'invalid'

export type MediaAssetResult = {
  input: string
  url: string
  kind: MediaAssetKind
  found: boolean
  reason?: string
  contentDir?: string
  resolvedKey?: string
}
