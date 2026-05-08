export const DIAGNOSTIC_LEVELS = new Set(['error', 'warning', 'info'])

export function createDiagnostic(input = {}) {
  const level = DIAGNOSTIC_LEVELS.has(input.level) ? input.level : 'warning'
  return {
    level,
    code: String(input.code || 'CSV_DIAGNOSTIC'),
    message: String(input.message || 'CSV diagnostic.'),
    rowNumber: Number.isFinite(Number(input.rowNumber)) ? Number(input.rowNumber) : null,
    block: input.block ? String(input.block) : '',
    field: input.field ? String(input.field) : '',
    optionKey: input.optionKey ? String(input.optionKey) : '',
    hint: input.hint ? String(input.hint) : '',
  }
}

export function diagnosticSeverityCounts(diagnostics = []) {
  const counts = { error: 0, warning: 0, info: 0 }
  for (const diagnostic of diagnostics) {
    if (diagnostic?.level in counts) counts[diagnostic.level] += 1
  }
  return counts
}

export function formatDiagnostic(diagnostic) {
  const parts = [`[${diagnostic.level}]`, `[${diagnostic.code}]`]
  const location = []
  if (diagnostic.rowNumber) location.push(`row ${diagnostic.rowNumber}`)
  if (diagnostic.block) location.push(`block "${diagnostic.block}"`)
  if (diagnostic.field) location.push(`field "${diagnostic.field}"`)
  if (diagnostic.optionKey) location.push(`option "${diagnostic.optionKey}"`)
  if (location.length) parts.push(`${location.join(', ')}:`)
  parts.push(diagnostic.message)
  if (diagnostic.hint) parts.push(`Hint: ${diagnostic.hint}`)
  return parts.join(' ')
}

export function diagnosticsToLegacyMessages(diagnostics = [], level) {
  return diagnostics
    .filter((diagnostic) => !level || diagnostic.level === level)
    .map(formatDiagnostic)
}
