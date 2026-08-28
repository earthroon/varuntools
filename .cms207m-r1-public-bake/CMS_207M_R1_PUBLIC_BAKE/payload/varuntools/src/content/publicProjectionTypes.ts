export type PublicMediaField =
  | 'mediaKind'
  | 'container'
  | 'codec'
  | 'codecId'
  | 'width'
  | 'height'
  | 'codedWidth'
  | 'codedHeight'
  | 'durationMs'
  | 'sampleRateHz'
  | 'channels'
  | 'displayRotationDegrees'
  | 'structuralMode'

export type PublicMediaProjectionState =
  | 'verified'
  | 'partial'
  | 'legacy_ready'
  | 'unobserved'
  | 'unsupported'
  | 'invalid'
  | 'stale'
  | 'binding_required'

export type PublicMediaFieldSource =
  | 'object_wasm'
  | 'asset_physical'
  | 'legacy_video'
  | 'materialized_hint'

export type PublicMediaProjection = {
  state: PublicMediaProjectionState
  mediaKind: 'image' | 'video' | 'audio' | 'other' | null
  container: string | null
  codec: string | null
  codecId: string | null
  width: number | null
  height: number | null
  codedWidth: number | null
  codedHeight: number | null
  durationMs: string | null
  sampleRateHz: number | null
  channels: number | null
  displayRotationDegrees: 0 | 90 | 180 | 270 | null
  structuralMode: string | null
  authoritativeFields: PublicMediaField[]
  reasonCode: string | null
}

export type PublicAssetAuthority = {
  class: 'object_wasm' | 'asset_physical' | 'legacy_video' | 'materialized_hint' | 'none'
  parserRevision: string | null
  parserAbiVersion: number | null
  evidenceDigest: string | null
  observationDigest: string | null
  sourceCurrent: boolean
  fieldSources: Partial<Record<PublicMediaField, PublicMediaFieldSource>>
}

export type PublicAssetProjection = {
  schemaVersion: 'vacms-public-asset@1'
  assetId: string
  pageId: string | null
  role: string
  filename: string
  mime: string
  publicPath: string | null
  sizeBytes: number | null
  hash: string | null
  presentation: {
    posterAssetId: string | null
    posterPublicPath: string | null
  }
  media: PublicMediaProjection
  authority: PublicAssetAuthority
}

export type VacmsPublicProjectionV1 = {
  schemaVersion: 'vacms-public-projection@1'
  projectionRevision: 'CMS-207M-R1'
  page: {
    pageId: string
    revisionId: string
    slug: string
    routePath: string
    title: string
    summary: string
    category: string
    kind: string
    visibility: string
    status: string
    tags: string[]
    contentHash: string
    timing: {
      revisionCreatedAt: string | null
      publishJobCreatedAt: string | null
      explicitPublishedAt: string | null
    }
  }
  assets: PublicAssetProjection[]
  authority: {
    semanticSource: 'vacms-d1'
    assetSource: 'vacms-d1'
    mediaProjectionPolicy: 'cms-207m-r1-field-level-authority'
    objectWasmBindingState: 'r8_required'
  }
}

export type PublicAssetManifest = {
  schemaVersion: 'cms-207m-public-asset-manifest@1'
  projectionRevision: 'CMS-207M-R1'
  assets: Record<string, PublicAssetProjection>
}
