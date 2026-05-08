export type ValidationSeverity = 'error' | 'warning'

export type ValidationIssueKind =
  | 'missing-required-field'
  | 'invalid-enum'
  | 'duplicate-slug'
  | 'reserved-slug-conflict'
  | 'invalid-slug-format'
  | 'missing-related-slug'
  | 'self-related-slug'
  | 'related-hidden-or-archived'
  | 'missing-asset'
  | 'invalid-date-format'
  | 'invalid-array-field'
  | 'invalid-number-field'
  | 'invalid-boolean-field'
  | 'invalid-canonical'
  | 'empty-seo-field'
  | 'draft-indexed'

export type ContentValidationIssue = {
  severity: ValidationSeverity
  kind: ValidationIssueKind
  file: string
  message: string
  field?: string
  value?: unknown
}

export type ContentValidationReport = {
  ok: boolean
  errorCount: number
  warningCount: number
  issues: ContentValidationIssue[]
}
