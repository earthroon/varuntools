import fs from 'node:fs'
import { diagnosticSeverityCounts, formatDiagnostic } from './csv-diagnostics.mjs'

function normalizeText(value = '') {
  return String(value ?? '').replace(/\r\n/g, '\n')
}

export function readCurrentMarkdown(outputPath) {
  if (!outputPath || !fs.existsSync(outputPath)) return ''
  return fs.readFileSync(outputPath, 'utf8')
}

export function compareGeneratedMarkdown({
  sourcePath = 'page.csv',
  outputPath = 'index.md',
  currentMarkdown = '',
  generatedMarkdown = '',
  diagnostics = [],
  summary = {},
} = {}) {
  const current = normalizeText(currentMarkdown)
  const generated = normalizeText(generatedMarkdown)
  const counts = diagnosticSeverityCounts(diagnostics)
  return {
    sourcePath,
    outputPath,
    changed: current !== generated,
    currentLength: current.length,
    generatedLength: generated.length,
    diagnostics,
    errorCount: counts.error,
    warningCount: counts.warning,
    infoCount: counts.info,
    summary: {
      ...summary,
      sourcePath: summary.sourcePath || sourcePath,
      outputPath: summary.outputPath || outputPath,
    },
  }
}

function commonPrefixLength(a, b) {
  const max = Math.min(a.length, b.length)
  let index = 0
  while (index < max && a[index] === b[index]) index += 1
  return index
}

function commonSuffixLength(a, b, prefixLength) {
  const max = Math.min(a.length, b.length) - prefixLength
  let index = 0
  while (index < max && a[a.length - 1 - index] === b[b.length - 1 - index]) index += 1
  return index
}

export function diffMarkdown(currentText = '', nextText = '', options = {}) {
  const current = normalizeText(currentText).split('\n')
  const next = normalizeText(nextText).split('\n')
  const prefix = commonPrefixLength(current, next)
  const suffix = commonSuffixLength(current, next, prefix)
  const currentMiddle = current.slice(prefix, current.length - suffix)
  const nextMiddle = next.slice(prefix, next.length - suffix)
  const context = Number.isFinite(Number(options.context)) ? Math.max(0, Number(options.context)) : 3
  const beforeContextStart = Math.max(0, prefix - context)
  const afterNextStart = next.length - suffix
  return {
    changed: normalizeText(currentText) !== normalizeText(nextText),
    currentLine: prefix + 1,
    beforeContext: current.slice(beforeContextStart, prefix),
    current: currentMiddle,
    next: nextMiddle,
    afterContext: next.slice(afterNextStart, Math.min(next.length, afterNextStart + context)),
  }
}

export function formatMarkdownDiff(diff, options = {}) {
  if (!diff.changed) return 'No changes'
  const currentLabel = options.currentLabel || 'current index.md'
  const nextLabel = options.nextLabel || 'generated from page.csv'
  const lines = [`--- ${currentLabel}`, `+++ ${nextLabel}`, `@@ line ${diff.currentLine} @@`]
  for (const line of diff.beforeContext || []) lines.push(`  ${line}`)
  for (const line of diff.current || []) lines.push(`- ${line}`)
  for (const line of diff.next || []) lines.push(`+ ${line}`)
  for (const line of diff.afterContext || []) lines.push(`  ${line}`)
  return lines.join('\n')
}

export function buildCsvMarkdownReport(input = {}) {
  return compareGeneratedMarkdown(input)
}

export function formatCsvMarkdownReport(report) {
  const summary = report.summary || {}
  const blockCounts = summary.blockCounts || {}
  const lines = [
    'CSV Markdown Report',
    '',
    `source: ${report.sourcePath || summary.sourcePath || 'page.csv'}`,
    `output: ${report.outputPath || summary.outputPath || 'index.md'}`,
    `rows: ${summary.rowCount ?? 0}`,
    `changed: ${report.changed ? 'true' : 'false'}`,
    `currentLength: ${report.currentLength ?? 0}`,
    `generatedLength: ${report.generatedLength ?? 0}`,
    '',
    'blocks:',
  ]
  const entries = Object.entries(blockCounts)
  if (entries.length) {
    for (const [block, count] of entries) lines.push(`- ${block}: ${count}`)
  } else {
    lines.push('- none: 0')
  }
  const assetSummary = summary.assetSummary || {}
  const portfolioLinksSummary = summary.portfolioLinksSummary || {}
  lines.push('', 'diagnostics:', `- errors: ${report.errorCount ?? 0}`, `- warnings: ${report.warningCount ?? 0}`)
  if (Object.keys(assetSummary).length) {
    lines.push(
      '',
      'assets:',
      `- checked: ${assetSummary.checked ?? 0}`,
      `- local: ${assetSummary.local ?? 0}`,
      `- public: ${assetSummary.public ?? 0}`,
      `- external: ${assetSummary.external ?? 0}`,
      `- missing: ${assetSummary.missing ?? 0}`,
      `- warnings: ${assetSummary.warnings ?? 0}`,
      `- errors: ${assetSummary.errors ?? 0}`,
    )
  }
  if (Object.keys(portfolioLinksSummary).length) {
    lines.push(
      '',
      'portfolio links:',
      `- related refs: ${portfolioLinksSummary.relatedRefs ?? 0}`,
      `- resolved: ${portfolioLinksSummary.resolved ?? 0}`,
      `- missing: ${portfolioLinksSummary.missing ?? 0}`,
      `- hidden: ${portfolioLinksSummary.hidden ?? 0}`,
      `- duplicates: ${portfolioLinksSummary.duplicates ?? 0}`,
      `- warnings: ${portfolioLinksSummary.warnings ?? 0}`,
      `- errors: ${portfolioLinksSummary.errors ?? 0}`,
    )
  }

  const diagnostics = report.diagnostics || []
  if (diagnostics.length) {
    lines.push('', 'diagnostic details:')
    for (const diagnostic of diagnostics) lines.push(`- ${formatDiagnostic(diagnostic)}`)
  }
  return lines.join('\n')
}
