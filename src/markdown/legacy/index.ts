import { applyLegacyBeforeAfterAdapter } from './legacyBeforeAfterAdapter'
import { applyLegacyBoxAdapter } from './legacyBoxAdapter'
import { applyLegacyPagecardAdapter } from './legacyPagecardAdapter'
import { applyLegacySectionGapAdapter } from './legacySectionGapAdapter'
import type { LegacyTransformReport } from './types'

export type ApplyLegacyMarkdownAdaptersResult = {
  content: string
  report: LegacyTransformReport
}

function mergeReports(...reports: LegacyTransformReport[]): LegacyTransformReport {
  return {
    changed: reports.some((report) => report.changed),
    items: reports.flatMap((report) => report.items),
  }
}

export function applyLegacyMarkdownAdapters(
  content: string,
): ApplyLegacyMarkdownAdaptersResult {
  const sectionGap = applyLegacySectionGapAdapter(content)
  const beforeAfter = applyLegacyBeforeAfterAdapter(sectionGap.content)
  const pagecards = applyLegacyPagecardAdapter(beforeAfter.content)
  const boxes = applyLegacyBoxAdapter(pagecards.content)

  return {
    content: boxes.content,
    report: mergeReports(sectionGap.report, beforeAfter.report, pagecards.report, boxes.report),
  }
}
