import type { ContentValidationIssue, ContentValidationReport } from './contentValidationTypes'

export function createContentValidationReport(
  issues: ContentValidationIssue[],
): ContentValidationReport {
  const errorCount = issues.filter((issue) => issue.severity === 'error').length
  const warningCount = issues.filter((issue) => issue.severity === 'warning').length

  return {
    ok: errorCount === 0,
    errorCount,
    warningCount,
    issues,
  }
}
