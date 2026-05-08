import { createDiagnostic } from './csv-diagnostics.mjs'

function contextDiagnostic(context, input) {
  return createDiagnostic({
    rowNumber: context.rowNumber,
    block: context.block,
    field: context.field || 'options',
    ...input,
  })
}

function isEscaped(text, index) {
  let slashCount = 0
  for (let cursor = index - 1; cursor >= 0 && text[cursor] === '\\'; cursor -= 1) slashCount += 1
  return slashCount % 2 === 1
}

function splitTopLevel(input, delimiter, context = {}) {
  const segments = []
  let current = ''
  let inQuote = false
  let bracketDepth = 0
  const diagnostics = []
  const text = String(input ?? '')

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (char === '"' && !isEscaped(text, index)) {
      inQuote = !inQuote
      current += char
      continue
    }
    if (!inQuote) {
      if (char === '[') bracketDepth += 1
      else if (char === ']') bracketDepth -= 1
      if (bracketDepth < 0) {
        diagnostics.push(contextDiagnostic(context, {
          level: 'error',
          code: 'CSV_INVALID_OPTION_ARRAY',
          message: 'Array option has a closing bracket without an opening bracket.',
        }))
        bracketDepth = 0
      }
      if (char === delimiter && bracketDepth === 0 && !isEscaped(text, index)) {
        segments.push(current)
        current = ''
        continue
      }
    }
    current += char
  }

  if (inQuote) {
    diagnostics.push(contextDiagnostic(context, {
      level: 'error',
      code: 'CSV_UNCLOSED_OPTION_QUOTE',
      message: `Unclosed quote in ${context.field || 'options'}.`,
    }))
  }
  if (bracketDepth > 0) {
    diagnostics.push(contextDiagnostic(context, {
      level: 'error',
      code: 'CSV_INVALID_OPTION_ARRAY',
      message: 'Array option is missing closing bracket.',
    }))
  }

  segments.push(current)
  return { segments, diagnostics }
}

export function tokenizeOptionSegments(input = '', context = {}) {
  return splitTopLevel(input, ';', context)
}

function findTopLevelEquals(segment, context = {}) {
  let inQuote = false
  let bracketDepth = 0
  const text = String(segment ?? '')
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (char === '"' && !isEscaped(text, index)) {
      inQuote = !inQuote
      continue
    }
    if (!inQuote) {
      if (char === '[') bracketDepth += 1
      else if (char === ']') bracketDepth -= 1
      if (char === '=' && bracketDepth === 0 && !isEscaped(text, index)) return index
    }
  }
  return -1
}

export function splitKeyValue(segment, context = {}) {
  const text = String(segment ?? '').trim()
  if (!text) return { key: '', rawValue: '', diagnostics: [], empty: true }
  const equalsIndex = findTopLevelEquals(text, context)
  if (equalsIndex < 0) {
    return {
      key: '',
      rawValue: '',
      diagnostics: [contextDiagnostic(context, {
        level: 'error',
        code: 'CSV_INVALID_OPTION_SYNTAX',
        message: `Option segment "${text}" must use key=value syntax.`,
      })],
      empty: false,
    }
  }
  const key = text.slice(0, equalsIndex).trim()
  const rawValue = text.slice(equalsIndex + 1).trim()
  if (!key) {
    return {
      key,
      rawValue,
      diagnostics: [contextDiagnostic(context, {
        level: 'error',
        code: 'CSV_EMPTY_OPTION_KEY',
        message: 'Option key is empty.',
      })],
      empty: false,
    }
  }
  return { key, rawValue, diagnostics: [], empty: false }
}

export function unescapeOptionString(input = '', context = {}) {
  const diagnostics = []
  const text = String(input ?? '')
  let output = ''
  const allowedEscapes = new Set([';', '|', '=', '"', '\\', ',', '[', ']'])
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (char !== '\\') {
      output += char
      continue
    }
    const next = text[index + 1]
    if (next === undefined) {
      diagnostics.push(contextDiagnostic(context, {
        level: 'error',
        code: 'CSV_INVALID_OPTION_ESCAPE',
        message: 'Option value ends with an unfinished escape sequence.',
      }))
      output += char
      continue
    }
    if (!allowedEscapes.has(next)) {
      diagnostics.push(contextDiagnostic(context, {
        level: 'error',
        code: 'CSV_INVALID_OPTION_ESCAPE',
        message: `Unsupported option escape "\\${next}".`,
      }))
    }
    output += next
    index += 1
  }
  return { value: output, diagnostics }
}

export function unquoteString(rawValue = '', context = {}) {
  const text = String(rawValue ?? '').trim()
  if (!text.startsWith('"')) return unescapeOptionString(text, context)
  if (text.length < 2 || !text.endsWith('"') || isEscaped(text, text.length - 1)) {
    return {
      value: text.slice(1),
      diagnostics: [contextDiagnostic(context, {
        level: 'error',
        code: 'CSV_UNCLOSED_OPTION_QUOTE',
        message: `Unclosed quote in ${context.field || 'options'}.`,
      })],
    }
  }
  return unescapeOptionString(text.slice(1, -1), context)
}

function parsePrimitiveValue(rawValue = '', context = {}) {
  const text = String(rawValue ?? '').trim()
  if (text === 'true') return { value: true, diagnostics: [] }
  if (text === 'false') return { value: false, diagnostics: [] }
  if (text === 'null') return { value: null, diagnostics: [] }
  if (/^-?\d+(?:\.\d+)?$/.test(text)) return { value: Number(text), diagnostics: [] }
  return unescapeOptionString(text, context)
}

export function parseArrayValue(rawValue = '', context = {}) {
  const text = String(rawValue ?? '').trim()
  if (!text.endsWith(']')) {
    return {
      value: [],
      diagnostics: [contextDiagnostic(context, {
        level: 'error',
        code: 'CSV_INVALID_OPTION_ARRAY',
        message: 'Array option is missing closing bracket.',
        optionKey: context.optionKey,
      })],
    }
  }
  const inner = text.slice(1, -1).trim()
  if (!inner) return { value: [], diagnostics: [] }
  const split = splitTopLevel(inner, ',', context)
  const diagnostics = [...split.diagnostics]
  const value = []
  for (const segment of split.segments) {
    const itemRaw = segment.trim()
    if (!itemRaw) continue
    const item = parseOptionValue(itemRaw, { ...context, inArray: true })
    diagnostics.push(...item.diagnostics)
    value.push(item.value)
  }
  return { value, diagnostics }
}

export function parseOptionValue(rawValue = '', context = {}) {
  const text = String(rawValue ?? '').trim()
  if (!text) return { value: '', diagnostics: [] }
  if (text.startsWith('"')) return unquoteString(text, context)
  if (text.startsWith('[')) return parseArrayValue(text, context)

  const pipeSplit = splitTopLevel(text, '|', context)
  if (pipeSplit.segments.length > 1) {
    const diagnostics = [...pipeSplit.diagnostics]
    const value = []
    for (const segment of pipeSplit.segments) {
      const parsed = parsePrimitiveValue(segment.trim(), context)
      diagnostics.push(...parsed.diagnostics)
      if (String(segment).trim()) value.push(parsed.value)
    }
    return { value, diagnostics }
  }

  return parsePrimitiveValue(text, context)
}

export function parseOptionStringWithDiagnostics(input = '', context = {}) {
  const value = {}
  const diagnostics = []
  const tokens = []
  const seenKeys = new Set()
  const strict = Boolean(context.strict)
  const text = String(input ?? '').trim()
  if (!text) return { value, diagnostics, tokens }

  const tokenized = tokenizeOptionSegments(text, context)
  diagnostics.push(...tokenized.diagnostics)

  for (const segment of tokenized.segments) {
    const split = splitKeyValue(segment, context)
    diagnostics.push(...split.diagnostics)
    if (split.empty || !split.key) continue

    const key = split.key
    if (seenKeys.has(key)) {
      diagnostics.push(contextDiagnostic(context, {
        level: strict ? 'error' : 'warning',
        code: 'CSV_DUPLICATE_OPTION_KEY',
        message: `Option "${key}" is duplicated. Last value wins.`,
        optionKey: key,
      }))
    }
    seenKeys.add(key)

    const parsed = parseOptionValue(split.rawValue, { ...context, optionKey: key })
    diagnostics.push(...parsed.diagnostics.map((diagnostic) => ({ ...diagnostic, optionKey: diagnostic.optionKey || key })))
    setNestedValue(value, key, parsed.value)
    tokens.push({ key, rawValue: split.rawValue, value: parsed.value })
  }

  return { value, diagnostics, tokens }
}

export function parseMetaStringWithDiagnostics(input = '', context = {}) {
  return parseOptionStringWithDiagnostics(input, { ...context, field: context.field || 'meta' })
}

export function parseOptionString(input = '') {
  return parseOptionStringWithDiagnostics(input).value
}

export function parseMetaString(input = '') {
  return parseMetaStringWithDiagnostics(input).value
}

export function setNestedValue(target, key, value) {
  const parts = String(key || '').split('.').map((part) => part.trim()).filter(Boolean)
  if (!parts.length) return
  let cursor = target
  for (const part of parts.slice(0, -1)) {
    if (!cursor[part] || typeof cursor[part] !== 'object' || Array.isArray(cursor[part])) cursor[part] = {}
    cursor = cursor[part]
  }
  cursor[parts[parts.length - 1]] = value
}

export function parseScalar(value) {
  return parseOptionValue(value).value
}

export function flattenOptionKeys(options = {}, prefix = '') {
  const keys = []
  for (const [key, value] of Object.entries(options || {})) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nestedKeys = flattenOptionKeys(value, fullKey)
      if (nestedKeys.length) keys.push(...nestedKeys)
      else keys.push(fullKey)
    } else {
      keys.push(fullKey)
    }
  }
  return keys
}

export function getNestedOptionValue(options = {}, key = '') {
  const parts = String(key || '').split('.').filter(Boolean)
  let cursor = options
  for (const part of parts) {
    if (!cursor || typeof cursor !== 'object' || !(part in cursor)) return undefined
    cursor = cursor[part]
  }
  return cursor
}
