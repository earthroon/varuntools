export function parseCsv(input) {
  const text = String(input || '').replace(/^\uFEFF/, '')
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"'
        i += 1
      } else if (char === '"') {
        inQuotes = false
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
      continue
    }

    if (char === ',') {
      row.push(field)
      field = ''
      continue
    }

    if (char === '\r') {
      if (next === '\n') i += 1
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      continue
    }

    if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      continue
    }

    field += char
  }

  if (inQuotes) {
    throw new Error('CSV parse error: unterminated quoted field')
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows.filter((cells) => cells.some((cell) => String(cell).trim() !== ''))
}

export function csvRowsToObjects(rows, options = {}) {
  if (!rows.length) return []
  const header = rows[0].map((cell) => String(cell || '').trim())
  const seen = new Set()
  const duplicateHeaders = []
  for (const key of header) {
    if (!key) continue
    if (seen.has(key) && !duplicateHeaders.includes(key)) duplicateHeaders.push(key)
    seen.add(key)
  }

  return rows.slice(1).map((cells, index) => {
    const rowNumber = index + 2
    const object = {
      __line: rowNumber,
      __rowNumber: rowNumber,
      __source: options.sourcePath || '',
      __headers: header,
      __duplicateHeaders: duplicateHeaders,
    }
    header.forEach((key, cellIndex) => {
      if (!key) return
      object[key] = cells[cellIndex] ?? ''
    })
    return object
  })
}

export function stringifyCsv(rows) {
  return rows.map((row) => row.map(escapeCsvField).join(',')).join('\n')
}

function escapeCsvField(value) {
  const text = String(value ?? '')
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`
  }
  return text
}
