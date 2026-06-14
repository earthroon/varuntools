import { createDiagnostic } from './csv-diagnostics.mjs'
import { flattenOptionKeys, getNestedOptionValue, parseOptionStringWithDiagnostics } from './csv-options.mjs'

export const CSV_REQUIRED_COLUMNS = ['block', 'title', 'body', 'src', 'alt', 'caption', 'thumb', 'layout', 'kind', 'options', 'meta']
export const CSV_BASE_FIELDS = [...CSV_REQUIRED_COLUMNS]

const WORK_OPTIONS = [
  'work',
  'work.type',
  'work.status',
  'work.featured',
  'work.weight',
  'work.period',
  'work.year',
  'work.client',
  'work.role',
  'work.stack',
  'work.tools',
  'work.tags',
  'work.category',
  'work.summary',
  'work.mood',
  'work.mood.tone',
  'work.mood.density',
  'work.mood.color',
  'work.links',
  'work.links.demo',
  'work.links.repo',
  'work.links.caseStudy',
]

const PAGE_OPTIONS = [
  'slug', 'kind', 'status', 'visibility', 'robots', 'noindex', 'tags', 'order', 'featured', 'series', 'collection', 'releaseDate',
  'client', 'role', 'stack', 'tools', 'weight', 'year', 'period', 'category', 'summary', 'template',
  'mood', 'mood.tone', 'mood.density', 'mood.color', 'gallery', 'gallery.autoMini',
  ...WORK_OPTIONS,
]

const PRODUCT_OPTIONS = [
  'type', 'status', 'slug', 'sku', 'price', 'currency', 'priceVisible', 'shippingRequired', 'showWhenUnavailable',
  'isDemo', 'readyForCatalog', 'stock', 'checkoutProvider', 'checkoutMode', 'checkoutUrl', 'successUrl', 'failUrl',
  'claimRedirect', 'externalStoreUrl', 'externalUrl', 'downloadProvider', 'downloadUrl', 'license', 'category',
  'subcategory', 'series', 'collection', 'material', 'size', 'releaseDate', 'shippingNote', 'refundNote',
  'digitalDeliveryNote', 'policyNote', 'inquiryUrl', 'usageScope',
]

const PORTFOLIO_OPTIONS = [
  'role', 'stack', 'tools', 'year', 'period', 'client', 'status', 'featured', 'tags', 'tone', 'density',
  'category', 'summary', 'scope', 'severity', 'axis', 'strategy', 'step', 'phase', 'weight', 'risk', 'ssot', 'tradeoff',
  'impact', 'value', 'unit', 'label', 'delta', 'language', 'runtime', 'storage', 'responsibility',
  'by', 'size', 'items', 'columns', 'variant', 'captionStyle', 'span', 'focus', 'layout', 'showStatus', 'limit',
]

export const CSV_BLOCK_SCHEMAS = {
  page: {
    required: ['title'],
    recommended: ['body', 'thumb'],
    allowedFields: CSV_BASE_FIELDS,
    allowedOptions: PAGE_OPTIONS,
  },
  product: {
    required: ['title'],
    recommended: ['body', 'src'],
    allowedFields: CSV_BASE_FIELDS,
    allowedOptions: PRODUCT_OPTIONS,
  },
  heading: {
    required: ['title'],
    recommended: [],
    allowedFields: CSV_BASE_FIELDS,
    allowedOptions: ['level', 'anchor', 'eyebrow'],
  },
  paragraph: {
    required: ['body'],
    recommended: [],
    allowedFields: CSV_BASE_FIELDS,
    allowedOptions: ['tone', 'variant'],
  },
  box: {
    required: ['body'],
    recommended: ['title'],
    allowedFields: CSV_BASE_FIELDS,
    allowedOptions: ['type', 'tone', 'icon'],
  },
  image: {
    required: ['src'],
    recommended: ['alt', 'caption'],
    allowedFields: CSV_BASE_FIELDS,
    allowedOptions: ['width', 'height', 'loading', 'variant'],
  },
  'section-gap': {
    required: [],
    recommended: [],
    allowedFields: CSV_BASE_FIELDS,
    allowedOptions: ['size'],
  },
  'product-cta': {
    required: [],
    recommended: [],
    allowedFields: CSV_BASE_FIELDS,
    allowedOptions: ['variant', 'label'],
  },
  'product-trust': {
    required: [],
    recommended: [],
    allowedFields: CSV_BASE_FIELDS,
    allowedOptions: ['variant'],
  },
  'before-after': {
    required: ['src'],
    recommended: ['alt', 'caption'],
    allowedFields: CSV_BASE_FIELDS,
    allowedOptions: ['after', 'initial', 'beforeLabel', 'afterLabel'],
    requiresOptions: ['after'],
  },
  video: {
    required: ['src'],
    recommended: ['thumb'],
    allowedFields: CSV_BASE_FIELDS,
    allowedOptions: ['autoplay', 'muted', 'loop', 'controls', 'playsinline'],
  },
  'gallery-start': {
    required: [],
    recommended: ['title'],
    allowedFields: CSV_BASE_FIELDS,
    allowedOptions: ['lightbox', 'autoMini', 'variant', 'gap'],
  },
  'gallery-item': {
    required: ['src'],
    recommended: ['caption'],
    allowedFields: CSV_BASE_FIELDS,
    allowedOptions: ['title', 'tag', 'href'],
  },
  'gallery-end': {
    required: [],
    recommended: [],
    allowedFields: CSV_BASE_FIELDS,
    allowedOptions: [],
  },
  raw: {
    required: ['body'],
    recommended: [],
    allowedFields: CSV_BASE_FIELDS,
    allowedOptions: ['reason'],
    allowsRaw: true,
  },

  'portfolio-hero': {
    required: ['title', 'body'],
    recommended: ['src', 'alt', 'thumb', 'options.role', 'options.stack', 'options.year'],
    allowedFields: CSV_BASE_FIELDS,
    allowedOptions: PORTFOLIO_OPTIONS,
  },
  'work-summary': {
    required: ['title', 'body'],
    recommended: ['options.role', 'options.stack', 'options.period'],
    allowedFields: CSV_BASE_FIELDS,
    allowedOptions: PORTFOLIO_OPTIONS,
  },
  'role-stack': {
    required: [],
    recommended: ['options.role', 'options.stack'],
    requiresOneOf: [['title', 'body', 'options.role', 'options.stack', 'options.tools']],
    allowedFields: CSV_BASE_FIELDS,
    allowedOptions: PORTFOLIO_OPTIONS,
  },
  problem: {
    required: ['body'],
    recommended: ['title'],
    allowedFields: CSV_BASE_FIELDS,
    allowedOptions: PORTFOLIO_OPTIONS,
  },
  solution: {
    required: ['body'],
    recommended: ['title'],
    allowedFields: CSV_BASE_FIELDS,
    allowedOptions: PORTFOLIO_OPTIONS,
  },
  process: {
    required: ['body'],
    recommended: ['title'],
    allowedFields: CSV_BASE_FIELDS,
    allowedOptions: PORTFOLIO_OPTIONS,
  },
  decision: {
    required: ['body'],
    recommended: ['title', 'kind'],
    allowedFields: CSV_BASE_FIELDS,
    allowedOptions: PORTFOLIO_OPTIONS,
  },
  result: {
    required: ['body'],
    recommended: ['title'],
    allowedFields: CSV_BASE_FIELDS,
    allowedOptions: PORTFOLIO_OPTIONS,
  },
  metric: {
    required: ['title'],
    recommended: ['body', 'options.value'],
    allowedFields: CSV_BASE_FIELDS,
    allowedOptions: PORTFOLIO_OPTIONS,
  },
  'tool-stack': {
    required: [],
    recommended: [],
    requiresOneOf: [['body', 'options.stack', 'options.tools', 'options.language', 'options.runtime', 'options.storage']],
    allowedFields: CSV_BASE_FIELDS,
    allowedOptions: PORTFOLIO_OPTIONS,
  },
  quote: {
    required: ['body'],
    recommended: ['title', 'options.by'],
    allowedFields: CSV_BASE_FIELDS,
    allowedOptions: PORTFOLIO_OPTIONS,
  },
  'case-gallery-start': {
    required: [],
    recommended: ['title'],
    allowedFields: CSV_BASE_FIELDS,
    allowedOptions: PORTFOLIO_OPTIONS,
  },
  'case-gallery-item': {
    required: ['src'],
    recommended: ['alt', 'caption'],
    allowedFields: CSV_BASE_FIELDS,
    allowedOptions: PORTFOLIO_OPTIONS,
  },
  'case-gallery-end': {
    required: [],
    recommended: [],
    allowedFields: CSV_BASE_FIELDS,
    allowedOptions: [],
  },
  'related-works': {
    required: [],
    recommended: ['title'],
    requiresOneOf: [['body', 'options.items']],
    allowedFields: CSV_BASE_FIELDS,
    allowedOptions: PORTFOLIO_OPTIONS,
  },
}

function asString(value) {
  return String(value ?? '').trim()
}

function isInternalField(key) {
  return key.startsWith('__')
}

function getRowNumber(row) {
  return row.__rowNumber || row.__line || null
}

function optionAllowed(optionKey, allowedOptions = []) {
  if (allowedOptions.includes(optionKey)) return true
  const parent = optionKey.split('.').slice(0, -1).join('.')
  return Boolean(parent && allowedOptions.includes(parent))
}

function rowContractValue(row, ref, parsedOptions) {
  if (String(ref).startsWith('options.')) {
    return getNestedOptionValue(parsedOptions || {}, String(ref).slice('options.'.length))
  }
  return row[ref]
}

function hasContractValue(row, ref, parsedOptions) {
  const value = rowContractValue(row, ref, parsedOptions)
  if (Array.isArray(value)) return value.length > 0
  if (value && typeof value === 'object') return Object.keys(value).length > 0
  return Boolean(asString(value))
}

function displayContractRef(ref) {
  return String(ref).startsWith('options.') ? String(ref) : `field "${ref}"`
}

export function validateCsvHeader(rows = []) {
  const diagnostics = []
  if (!rows.length) {
    diagnostics.push(createDiagnostic({
      level: 'error',
      code: 'CSV_EMPTY',
      message: 'CSV is empty.',
    }))
    return diagnostics
  }

  const first = rows[0]
  const headers = Array.isArray(first.__headers) ? first.__headers : Object.keys(first).filter((key) => !isInternalField(key))
  const duplicateHeaders = Array.isArray(first.__duplicateHeaders) ? first.__duplicateHeaders : []

  for (const header of duplicateHeaders) {
    diagnostics.push(createDiagnostic({
      level: 'error',
      code: 'CSV_DUPLICATE_HEADER',
      message: `CSV header contains duplicate column "${header}".`,
      field: header,
    }))
  }

  for (const column of CSV_REQUIRED_COLUMNS) {
    if (!headers.includes(column)) {
      diagnostics.push(createDiagnostic({
        level: 'error',
        code: 'CSV_REQUIRED_HEADER_MISSING',
        message: `CSV header is missing column "${column}".`,
        field: column,
      }))
    }
  }

  for (const header of headers) {
    if (!CSV_REQUIRED_COLUMNS.includes(header)) {
      diagnostics.push(createDiagnostic({
        level: 'warning',
        code: 'CSV_UNKNOWN_HEADER',
        message: `CSV header contains unknown column "${header}".`,
        field: header,
      }))
    }
  }

  return diagnostics
}

export function validateCsvBlockRow(row, context = {}) {
  const diagnostics = []
  const rowNumber = getRowNumber(row)
  const block = asString(row.block)
  const strict = Boolean(context.strict)

  if (!block) {
    diagnostics.push(createDiagnostic({
      level: 'error',
      code: 'CSV_EMPTY_BLOCK',
      message: 'CSV row is missing block.',
      rowNumber,
      field: 'block',
    }))
    return diagnostics
  }

  const schema = CSV_BLOCK_SCHEMAS[block]
  if (!schema) {
    diagnostics.push(createDiagnostic({
      level: 'error',
      code: 'CSV_UNKNOWN_BLOCK',
      message: `Unknown CSV block "${block}".`,
      rowNumber,
      block,
      field: 'block',
      hint: `Add "${block}" to CSV_BLOCK_SCHEMAS or fix the block name.`,
    }))
    return diagnostics
  }

  const optionParse = parseOptionStringWithDiagnostics(row.options, {
    rowNumber,
    block,
    field: 'options',
    strict,
  })
  diagnostics.push(...optionParse.diagnostics)
  const options = optionParse.value

  for (const field of schema.required || []) {
    if (!hasContractValue(row, field, options)) {
      diagnostics.push(createDiagnostic({
        level: 'error',
        code: String(field).startsWith('options.') ? 'CSV_REQUIRED_OPTION_MISSING' : 'CSV_REQUIRED_FIELD_MISSING',
        message: `${block} block requires ${displayContractRef(field)}.`,
        rowNumber,
        block,
        field: String(field).startsWith('options.') ? 'options' : field,
        optionKey: String(field).startsWith('options.') ? String(field).slice('options.'.length) : undefined,
      }))
    }
  }

  for (const field of schema.recommended || []) {
    if (!hasContractValue(row, field, options)) {
      diagnostics.push(createDiagnostic({
        level: 'warning',
        code: String(field).startsWith('options.') ? 'CSV_RECOMMENDED_OPTION_MISSING' : 'CSV_RECOMMENDED_FIELD_MISSING',
        message: `${block} block recommends ${displayContractRef(field)}.`,
        rowNumber,
        block,
        field: String(field).startsWith('options.') ? 'options' : field,
        optionKey: String(field).startsWith('options.') ? String(field).slice('options.'.length) : undefined,
      }))
    }
  }

  for (const group of schema.requiresOneOf || []) {
    if (!group.some((ref) => hasContractValue(row, ref, options))) {
      diagnostics.push(createDiagnostic({
        level: 'error',
        code: 'CSV_REQUIRES_ONE_OF_MISSING',
        message: `${block} block requires one of: ${group.join(', ')}.`,
        rowNumber,
        block,
        field: 'options',
        hint: 'Set at least one listed CSV field or options key.',
      }))
    }
  }

  for (const [field, value] of Object.entries(row)) {
    if (isInternalField(field) || !asString(value)) continue
    if (!(schema.allowedFields || CSV_BASE_FIELDS).includes(field)) {
      diagnostics.push(createDiagnostic({
        level: strict ? 'error' : 'warning',
        code: 'CSV_UNKNOWN_FIELD',
        message: `${block} block does not define field "${field}".`,
        rowNumber,
        block,
        field,
      }))
    }
  }

  const optionKeys = flattenOptionKeys(options)
  for (const optionKey of optionKeys) {
    if (!optionAllowed(optionKey, schema.allowedOptions || [])) {
      diagnostics.push(createDiagnostic({
        level: strict ? 'error' : 'warning',
        code: 'CSV_UNKNOWN_OPTION',
        message: `${block} block does not define option "${optionKey}".`,
        rowNumber,
        block,
        optionKey,
      }))
    }
  }

  for (const requiredOption of schema.requiresOptions || []) {
    if (!hasContractValue(row, `options.${requiredOption}`, options)) {
      diagnostics.push(createDiagnostic({
        level: 'error',
        code: 'CSV_REQUIRED_OPTION_MISSING',
        message: `${block} block requires option "${requiredOption}".`,
        rowNumber,
        block,
        optionKey: requiredOption,
      }))
    }
  }

  if (schema.allowsRaw) {
    diagnostics.push(createDiagnostic({
      level: 'warning',
      code: 'CSV_RAW_BLOCK_USED',
      message: 'raw block bypasses CSV authoring safety and must remain repo-authored only.',
      rowNumber,
      block,
    }))
  }

  return diagnostics
}

function validateDelimitedGroup(rows = [], contract) {
  const diagnostics = []
  let startRow = null
  const { start, item, end, label, codes } = contract

  for (const row of rows) {
    const block = asString(row.block)
    const rowNumber = getRowNumber(row)

    if (block === start) {
      if (startRow) {
        diagnostics.push(createDiagnostic({
          level: 'error',
          code: codes.nested,
          message: `Nested ${start} is not allowed.`,
          rowNumber,
          block,
        }))
      }
      startRow = row
    } else if (block === item) {
      if (!startRow) {
        diagnostics.push(createDiagnostic({
          level: 'error',
          code: codes.itemOutside,
          message: `${item} must appear between ${start} and ${end}.`,
          rowNumber,
          block,
        }))
      }
    } else if (block === end) {
      if (!startRow) {
        diagnostics.push(createDiagnostic({
          level: 'error',
          code: codes.endWithoutStart,
          message: `${end} appeared without ${start}.`,
          rowNumber,
          block,
        }))
      }
      startRow = null
    } else if (startRow && block) {
      diagnostics.push(createDiagnostic({
        level: 'error',
        code: codes.unclosedBeforeBlock,
        message: `${start} must be closed with ${end} before "${block}".`,
        rowNumber,
        block,
        hint: `Close the open ${label} group before adding another block.`,
      }))
    }
  }

  if (startRow) {
    diagnostics.push(createDiagnostic({
      level: 'error',
      code: codes.unclosed,
      message: `${start} missing ${end}.`,
      rowNumber: getRowNumber(startRow),
      block: start,
    }))
  }

  return diagnostics
}

export function validateCsvGalleryStructure(rows = []) {
  return [
    ...validateDelimitedGroup(rows, {
      start: 'gallery-start',
      item: 'gallery-item',
      end: 'gallery-end',
      label: 'gallery',
      codes: {
        nested: 'CSV_GALLERY_NESTED_GROUP',
        itemOutside: 'CSV_GALLERY_ITEM_OUTSIDE_GROUP',
        endWithoutStart: 'CSV_GALLERY_END_WITHOUT_START',
        unclosedBeforeBlock: 'CSV_GALLERY_UNCLOSED_BEFORE_BLOCK',
        unclosed: 'CSV_GALLERY_UNCLOSED',
      },
    }),
    ...validateDelimitedGroup(rows, {
      start: 'case-gallery-start',
      item: 'case-gallery-item',
      end: 'case-gallery-end',
      label: 'case-gallery',
      codes: {
        nested: 'CSV_CASE_GALLERY_NESTED_GROUP',
        itemOutside: 'CSV_CASE_GALLERY_ITEM_OUTSIDE_GROUP',
        endWithoutStart: 'CSV_CASE_GALLERY_END_WITHOUT_START',
        unclosedBeforeBlock: 'CSV_CASE_GALLERY_UNCLOSED_BEFORE_BLOCK',
        unclosed: 'CSV_CASE_GALLERY_UNCLOSED',
      },
    }),
  ]
}

export function validateCsvRows(rows = [], context = {}) {
  return [
    ...validateCsvHeader(rows),
    ...rows.flatMap((row) => validateCsvBlockRow(row, context)),
    ...validateCsvGalleryStructure(rows),
  ]
}

export function summarizeCsvRows(rows = [], diagnostics = [], context = {}) {
  const blockCounts = {}
  for (const row of rows) {
    const block = asString(row.block) || '(empty)'
    blockCounts[block] = (blockCounts[block] || 0) + 1
  }
  return {
    sourcePath: context.sourceCsvPath || 'page.csv',
    outputPath: context.outputMarkdownPath || 'index.md',
    rowCount: rows.length,
    blockCounts,
    errorCount: diagnostics.filter((diagnostic) => diagnostic.level === 'error').length,
    warningCount: diagnostics.filter((diagnostic) => diagnostic.level === 'warning').length,
  }
}
