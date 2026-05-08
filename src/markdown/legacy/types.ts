export type LegacyTransformKind =
  | 'section-gap-token'
  | 'before-after-legacy-marker'
  | 'pagecard-legacy-marker'
  | 'box-legacy-callout'

export type LegacyTransformItem = {
  kind: LegacyTransformKind
  line: number
  token: string
  output: string
}

export type LegacyTransformReport = {
  changed: boolean
  items: LegacyTransformItem[]
}
