import { getRequiredHeaders } from './sheet-schema.mjs'

function cleanCell(value) {
  return String(value ?? '').trim()
}

function isEmptyObject(row) {
  return Object.values(row).every((value) => cleanCell(value) === '')
}

function findDuplicateHeaders(headers) {
  const seen = new Set()
  const duplicates = new Set()
  for (const header of headers) {
    if (!header) continue
    if (seen.has(header)) duplicates.add(header)
    seen.add(header)
  }
  return [...duplicates]
}

function validateRequiredHeaders(tabName, headers, errors) {
  const headerSet = new Set(headers)
  for (const required of getRequiredHeaders(tabName)) {
    if (!headerSet.has(required)) {
      errors.push({
        code: 'sheet.header.missing',
        tab: tabName,
        message: `${tabName} is missing required header: ${required}`,
      })
    }
  }
}

export function rowsToObjects(tabName, values) {
  const warnings = []
  const errors = []
  const rawHeaders = values[0] ?? []
  const headers = rawHeaders.map(cleanCell)
  const activeHeaderEntries = headers
    .map((header, index) => ({ header, index }))
    .filter((entry) => entry.header)

  if (!headers.length || activeHeaderEntries.length === 0) {
    errors.push({
      code: 'sheet.header.empty',
      tab: tabName,
      message: `${tabName} has no header row.`,
    })
  }

  const duplicateHeaders = findDuplicateHeaders(headers)
  for (const header of duplicateHeaders) {
    errors.push({
      code: 'sheet.header.duplicate',
      tab: tabName,
      message: `${tabName} has duplicate header: ${header}`,
    })
  }

  validateRequiredHeaders(tabName, activeHeaderEntries.map((entry) => entry.header), errors)

  const rows = []
  let emptyRowsSkipped = 0

  for (const [index, valueRow] of values.slice(1).entries()) {
    const objectRow = {}
    for (const { header, index: columnIndex } of activeHeaderEntries) {
      objectRow[header] = cleanCell(valueRow[columnIndex])
    }
    if (isEmptyObject(objectRow)) {
      emptyRowsSkipped += 1
      continue
    }
    objectRow.__rowNumber = index + 2
    rows.push(objectRow)
  }

  if (emptyRowsSkipped > 0) {
    warnings.push({
      code: 'sheet.rows.emptySkipped',
      tab: tabName,
      message: `${emptyRowsSkipped} empty rows skipped in ${tabName}.`,
    })
  }

  return {
    generatedAt: new Date().toISOString(),
    sheetName: tabName,
    headers: activeHeaderEntries.map((entry) => entry.header),
    rows,
    emptyRowsSkipped,
    warnings,
    errors,
  }
}
