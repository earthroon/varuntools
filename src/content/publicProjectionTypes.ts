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

export type PublicPlaybackStreamProjection = { state:'ready'|'missing'|'stale'|'unsupported'; streamId:string|null; manifestPublicPath:string|null; manifestHash:string|null; profile:string|null; segmentCount:number|null; totalMediaBytes:number|null; videoCodec:string|null; audioCodec:string|null; width:number|null; height:number|null; durationMs:string|null }

export type PublicPlaybackProjection = {
  state: 'ready' | 'missing' | 'stale' | 'unsupported'
  variantId: string | null
  publicPath: string | null
  sourceIdentityDigest: string | null
  sourceHash: string | null
  playbackHash: string | null
  container: string | null
  videoCodec: string | null
  audioCodec: string | null
  width: number | null
  height: number | null
  durationMs: string | null
  sizeBytes: number | null
  policyRevision: string | null
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
  playback?: PublicPlaybackProjection
  playbackStream?: PublicPlaybackStreamProjection
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

export type PublicRuntimeDelivery = {
  class: 'direct_asset' | 'playback_segment_stream' | 'none'
  state: 'ready' | 'unavailable'
  publicPath: string | null
  renditionId: string | null
  streamId: string | null
  manifestPublicPath: string | null
  manifestHash: string | null
  profile: string | null
  segmentCount: number | null
  totalMediaBytes: number | null
  sizeBytes: number | null
  hash: string | null
  container: string | null
  videoCodec: string | null
  audioCodec: string | null
  width: number | null
  height: number | null
  durationMs: string | null
  policyRevision: string | null
  sourceIdentityDigest: string | null
  producerPlaybackState: 'ready' | 'missing' | 'stale' | 'unsupported'
  reason: string | null
}

export type PublicRuntimeAssetProjection = {
  schemaVersion: 'varuntools-public-runtime-asset@2'
  assetId: string
  pageId: string | null
  role: string
  filename: string
  mime: string
  presentation: {
    posterAssetId: string | null
    posterPublicPath: string | null
  }
  media: PublicMediaProjection | null
  authority: PublicAssetAuthority | null
  delivery: PublicRuntimeDelivery
}

export type PublicAssetManifest = {
  schemaVersion: 'cms-207m-public-asset-manifest@2'
  projectionRevision: 'CMS-207M-R1'
  runtimeRevision: 'VARUNTOOLS-PUBLIC-R2B'
  assets: Record<string, PublicRuntimeAssetProjection>
}
