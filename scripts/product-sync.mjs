#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const projectRoot = process.cwd()
const productsRoot = path.join(projectRoot, 'src/content/pages/products')

const FORBIDDEN_PUBLIC_SYNC_KEYS = new Set([
  'r2Key',
  'privatePath',
  'internalPath',
  'downloadUrl',
  'publicUrl',
  'grantId',
  'paymentKey',
  'webhookEventId',
  'purchaseOrderId',
  'buyerEmail',
  'deliverableSetId',
  'deliverableIds',
  'entitlement_scope_json',
  'entitlementScopeJson',
  'bundleInternalRefs',
])

const SYNC_FIELD_MAP = [
  { manifestPath: 'title', pagePath: 'title', severity: 'warning', write: true },
  { manifestPath: 'visibility', pagePath: 'visibility', severity: 'blocker', write: true },
  { manifestPath: 'slug', pagePath: 'product.slug', severity: 'blocker', write: true },
  { manifestPath: 'sku', pagePath: 'product.sku', severity: 'blocker', write: true },
  { manifestPath: 'product.type', pagePath: 'product.type', severity: 'blocker', write: true },
  { manifestPath: 'status', pagePath: 'product.status', severity: 'blocker', write: true },
  { manifestPath: 'checkout.provider', pagePath: 'product.checkoutProvider', severity: 'blocker', write: true },
  { manifestPath: 'checkout.mode', pagePath: 'product.checkoutMode', severity: 'blocker', write: true },
  { manifestPath: 'checkout.checkoutUrl', pagePath: 'product.checkoutUrl', severity: 'blocker', write: true },
  { manifestPath: 'checkout.successUrl', pagePath: 'product.successUrl', severity: 'warning', write: true },
  { manifestPath: 'checkout.failUrl', pagePath: 'product.failUrl', severity: 'warning', write: true },
  { manifestPath: 'checkout.claimRedirect', pagePath: 'product.claimRedirect', severity: 'warning', write: true },
  { manifestPath: 'isDemo', pagePath: 'product.isDemo', severity: 'blocker', write: true },
  { manifestPath: 'launch.readyForCatalog', pagePath: 'product.readyForCatalog', severity: 'blocker', write: true },
  { manifestPath: 'product.price', pagePath: 'product.price', severity: 'warning', write: true },
  { manifestPath: 'product.currency', pagePath: 'product.currency', severity: 'warning', write: true },
  { manifestPath: 'product.priceVisible', pagePath: 'product.priceVisible', severity: 'warning', write: true },
  { manifestPath: 'hasVariants', pagePath: 'product.hasVariants', severity: 'warning', write: true },
  { manifestPath: 'defaultVariantId', pagePath: 'product.defaultVariantId', severity: 'warning', write: true },
]

const args = process.argv.slice(2)
const options = parseArgs(args)

function parseArgs(argv) {
  const parsed = { mode: 'check', product: '', strict: false, json: false }
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--check') parsed.mode = 'check'
    else if (arg === '--write') parsed.mode = 'write'
    else if (arg === '--strict') parsed.strict = true
    else if (arg === '--json') parsed.json = true
    else if (arg === '--product') parsed.product = String(argv[++index] || '').trim()
    else if (arg.startsWith('--product=')) parsed.product = arg.slice('--product='.length).trim()
    else if (arg === '--help' || arg === '-h') {
      printHelp()
      process.exit(0)
    } else {
      console.error(`[product-sync] Unknown option: ${arg}`)
      process.exit(2)
    }
  }
  return parsed
}

function printHelp() {
  console.log(`product manifest/page sync

Usage:
  node scripts/product-sync.mjs --check [--product slug] [--strict] [--json]
  node scripts/product-sync.mjs --write [--product slug]

Rules:
  --check never writes files.
  --write only updates public-safe frontmatter fields.
  private delivery keys, R2 keys, public URLs, download URLs, grants, payments, and buyer data never sync into index.md.`)
}

function toProjectPath(filePath) {
  return path.relative(projectRoot, filePath).replace(/\\/g, '/')
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'))
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function getValue(source, dotPath) {
  if (!dotPath) return undefined
  let current = source
  for (const part of dotPath.split('.')) {
    if (!isPlainObject(current) || !(part in current)) return undefined
    current = current[part]
  }
  return current
}

function normalizeManifestValue(manifest, dotPath) {
  if (dotPath === 'status') return manifest.product?.status ?? manifest.status
  if (dotPath === 'sku') return manifest.product?.sku ?? manifest.sku
  if (dotPath === 'slug') return manifest.product?.slug ?? manifest.slug
  if (dotPath === 'visibility') return manifest.launch?.visibility ?? manifest.visibility
  if (dotPath === 'isDemo') return manifest.launch?.isDemo ?? manifest.isDemo
  if (dotPath === 'hasVariants') return Array.isArray(manifest.variants) && manifest.variants.length > 0
  if (dotPath === 'defaultVariantId') return Array.isArray(manifest.variants) ? (manifest.variants.find((variant) => variant.default)?.id || '') : ''
  return getValue(manifest, dotPath)
}

function splitFrontmatter(raw) {
  const normalized = raw.replace(/\r\n/g, '\n')
  if (!normalized.startsWith('---\n')) return null
  const closing = normalized.indexOf('\n---', 4)
  if (closing < 0) return null
  const afterMarker = closing + '\n---'.length
  const markerEnd = normalized[afterMarker] === '\n' ? afterMarker + 1 : afterMarker
  return {
    frontmatter: normalized.slice(4, closing),
    body: normalized.slice(markerEnd),
  }
}

function parseScalar(rawValue) {
  if (rawValue === undefined) return undefined
  let value = String(rawValue).trim()
  if (value === '') return ''
  if (value === '""' || value === "''") return ''
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1)
  }
  if (value === 'true') return true
  if (value === 'false') return false
  if (/^-?\d+(?:\.\d+)?$/.test(value)) return Number(value)
  return value
}

function formatScalar(value) {
  if (value === undefined || value === null) return '""'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  const text = String(value)
  if (text === '') return '""'
  if (/^[A-Za-z0-9_./:-]+$/.test(text)) return text
  return JSON.stringify(text)
}

function getYamlScalar(yaml, dotPath) {
  const parts = dotPath.split('.')
  if (parts.length === 1) {
    const re = new RegExp(`^${escapeRegExp(parts[0])}:\\s*(.*)$`, 'm')
    const match = yaml.match(re)
    return match ? parseScalar(match[1]) : undefined
  }

  if (parts[0] !== 'product') return undefined
  const block = getTopLevelBlock(yaml, 'product')
  if (!block) return undefined
  const field = parts.slice(1).join('.')
  if (field.includes('.')) return undefined
  const re = new RegExp(`^\\s{2}${escapeRegExp(field)}:\\s*(.*)$`, 'm')
  const match = block.match(re)
  return match ? parseScalar(match[1]) : undefined
}

function getTopLevelBlock(yaml, key) {
  const lines = yaml.split('\n')
  let start = -1
  for (let index = 0; index < lines.length; index += 1) {
    if (new RegExp(`^${escapeRegExp(key)}:\\s*$`).test(lines[index])) {
      start = index
      break
    }
  }
  if (start < 0) return ''
  const block = []
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index]
    if (/^\S/.test(line) && !/^\s/.test(line)) break
    block.push(line)
  }
  return block.join('\n')
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function valuesEqual(left, right) {
  if (left === undefined && right === undefined) return true
  if (left === undefined || right === undefined) return false
  if (left === '' && right === null) return true
  if (right === '' && left === null) return true
  return String(left) === String(right)
}

function setYamlScalar(yaml, dotPath, value) {
  assertPublicSyncPath(dotPath)
  const scalar = formatScalar(value)
  const parts = dotPath.split('.')
  const lines = yaml.split('\n')

  if (parts.length === 1) {
    const re = new RegExp(`^${escapeRegExp(parts[0])}:\\s*`)
    const existing = lines.findIndex((line) => re.test(line))
    if (existing >= 0) {
      lines[existing] = `${parts[0]}: ${scalar}`
      return lines.join('\n')
    }
    lines.push(`${parts[0]}: ${scalar}`)
    return lines.join('\n')
  }

  if (parts[0] !== 'product' || parts.length !== 2) {
    throw new Error(`Unsupported sync path: ${dotPath}`)
  }

  let productStart = lines.findIndex((line) => /^product:\s*$/.test(line))
  if (productStart < 0) {
    lines.push('product:')
    productStart = lines.length - 1
  }

  let productEnd = lines.length
  for (let index = productStart + 1; index < lines.length; index += 1) {
    if (/^\S/.test(lines[index]) && !/^\s/.test(lines[index])) {
      productEnd = index
      break
    }
  }

  const field = parts[1]
  const re = new RegExp(`^\\s{2}${escapeRegExp(field)}:\\s*`)
  for (let index = productStart + 1; index < productEnd; index += 1) {
    if (re.test(lines[index])) {
      lines[index] = `  ${field}: ${scalar}`
      return lines.join('\n')
    }
  }

  lines.splice(productEnd, 0, `  ${field}: ${scalar}`)
  return lines.join('\n')
}

function assertPublicSyncPath(dotPath) {
  for (const key of FORBIDDEN_PUBLIC_SYNC_KEYS) {
    if (dotPath === key || dotPath.endsWith(`.${key}`) || dotPath.includes(`${key}.`)) {
      throw new Error(`Refusing to sync private or runtime-only field into public page: ${dotPath}`)
    }
  }
}

function getProductDirs() {
  if (!existsSync(productsRoot)) return []
  return readdirSync(productsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(productsRoot, entry.name))
    .filter((dir) => existsSync(path.join(dir, 'product.manifest.json')))
    .filter((dir) => !options.product || path.basename(dir) === options.product)
    .sort()
}

function addIssue(issues, item, severity, code, message, detail = {}) {
  issues.push({ slug: item.slug, severity, code, message, ...detail })
}

function checkProduct(dir) {
  const folderSlug = path.basename(dir)
  const item = { slug: folderSlug, dir: toProjectPath(dir) }
  const issues = []
  const manifestPath = path.join(dir, 'product.manifest.json')
  const indexPath = path.join(dir, 'index.md')

  if (!existsSync(manifestPath)) {
    addIssue(issues, item, 'blocker', 'manifest-missing', 'Missing product.manifest.json.', { file: toProjectPath(manifestPath) })
    return { item, issues, write: null }
  }
  if (!existsSync(indexPath)) {
    addIssue(issues, item, 'blocker', 'index-missing', 'Missing index.md.', { file: toProjectPath(indexPath) })
    return { item, issues, write: null }
  }

  const manifest = readJson(manifestPath)
  const rawIndex = readFileSync(indexPath, 'utf8')
  const split = splitFrontmatter(rawIndex)
  if (!split) {
    addIssue(issues, item, 'blocker', 'frontmatter-missing', 'index.md must start with YAML frontmatter.', { file: toProjectPath(indexPath) })
    return { item, issues, write: null }
  }

  if (manifest.slug !== folderSlug) {
    addIssue(issues, item, 'blocker', 'manifest-slug-mismatch', `manifest.slug ${JSON.stringify(manifest.slug)} does not match folder slug ${JSON.stringify(folderSlug)}.`, { file: toProjectPath(manifestPath) })
  }

  const pageSlug = getYamlScalar(split.frontmatter, 'slug')
  const acceptedPageSlugs = new Set([folderSlug, `products/${folderSlug}`])
  if (pageSlug !== undefined && !acceptedPageSlugs.has(String(pageSlug))) {
    addIssue(issues, item, 'blocker', 'page-slug-mismatch', `index.md slug ${JSON.stringify(pageSlug)} should be ${JSON.stringify(`products/${folderSlug}`)} or ${JSON.stringify(folderSlug)}.`, { file: toProjectPath(indexPath), field: 'slug', manifestValue: folderSlug, pageValue: pageSlug })
  }

  const updates = []
  for (const mapping of SYNC_FIELD_MAP) {
    assertPublicSyncPath(mapping.pagePath)
    const manifestValue = normalizeManifestValue(manifest, mapping.manifestPath)
    if (manifestValue === undefined) continue
    const pageValue = getYamlScalar(split.frontmatter, mapping.pagePath)
    if (valuesEqual(pageValue, manifestValue)) continue
    addIssue(issues, item, mapping.severity, `sync-${mapping.pagePath.replaceAll('.', '-')}-mismatch`, `${mapping.pagePath} differs from product.manifest.json ${mapping.manifestPath}.`, { file: toProjectPath(indexPath), field: mapping.pagePath, manifestValue, pageValue })
    if (mapping.write) updates.push({ pagePath: mapping.pagePath, value: manifestValue })
  }

  checkManifestEntitlements(manifest, issues, item, manifestPath)
  scanForForbiddenPublicFields(split.frontmatter, issues, item, indexPath)

  return {
    item,
    issues,
    write: updates.length
      ? () => writeFrontmatterUpdates(indexPath, rawIndex, split, updates)
      : null,
  }
}


function uniqueValues(values) {
  return new Set(values).size === values.length
}

function checkManifestEntitlements(manifest, issues, item, manifestPath) {
  const file = toProjectPath(manifestPath)
  const deliverables = Array.isArray(manifest.delivery?.deliverables) ? manifest.delivery.deliverables : []
  const deliverableIds = new Set(deliverables.map((deliverable) => String(deliverable.id || '')).filter(Boolean))
  const variants = Array.isArray(manifest.variants) ? manifest.variants : []
  const deliverableSets = Array.isArray(manifest.deliverableSets) ? manifest.deliverableSets : []
  const bundles = Array.isArray(manifest.bundles) ? manifest.bundles : []
  const variantIds = variants.map((variant) => String(variant.id || '')).filter(Boolean)
  const setIds = deliverableSets.map((set) => String(set.id || '')).filter(Boolean)
  if (!uniqueValues(variantIds)) addIssue(issues, item, 'blocker', 'variant-id-duplicate', 'manifest.variants[].id must be unique.', { file })
  if (!uniqueValues(setIds)) addIssue(issues, item, 'blocker', 'deliverable-set-id-duplicate', 'manifest.deliverableSets[].id must be unique.', { file })
  if (variants.filter((variant) => Boolean(variant.default)).length > 1) addIssue(issues, item, 'blocker', 'default-variant-duplicate', 'Only one variant may be marked default.', { file })
  for (const variant of variants) {
    const id = String(variant.id || '')
    const setId = String(variant.deliverableSetId || '')
    if (setId && !setIds.includes(setId)) addIssue(issues, item, 'blocker', 'variant-deliverable-set-missing', `Variant ${id} references missing deliverableSetId ${setId}.`, { file })
    if (variant.status === 'active' && !setId) addIssue(issues, item, 'blocker', 'active-variant-missing-deliverable-set', `Active variant ${id} must reference a deliverableSetId.`, { file })
    if (variant.status === 'active' && (variant.checkoutMode === 'disabled' || !variant.checkoutUrl)) addIssue(issues, item, 'blocker', 'active-variant-checkout-disabled', `Active variant ${id} must have checkout metadata.`, { file })
  }
  for (const set of deliverableSets) {
    const id = String(set.id || '')
    const ids = Array.isArray(set.deliverableIds) ? set.deliverableIds.map(String) : []
    for (const deliverableId of ids) {
      if (!deliverableIds.has(deliverableId)) addIssue(issues, item, 'blocker', 'deliverable-set-missing-deliverable', `Deliverable set ${id} references missing deliverable ${deliverableId}.`, { file })
    }
    const usedByActive = variants.some((variant) => variant.status === 'active' && variant.deliverableSetId === id)
    if (usedByActive && ids.length === 0) addIssue(issues, item, 'blocker', 'active-deliverable-set-empty', `Active deliverable set ${id} cannot be empty.`, { file })
  }
  for (const bundle of bundles) {
    const id = String(bundle.id || '')
    for (const ref of bundle.variantRefs || []) {
      if (String(ref.productSlug || '') === manifest.slug && !variantIds.includes(String(ref.variantId || ''))) {
        addIssue(issues, item, 'blocker', 'bundle-variant-ref-missing', `Bundle ${id} references missing variant ${ref.variantId}.`, { file })
      }
    }
    if (bundle.status === 'active' && (bundle.checkoutMode === 'disabled' || !bundle.checkoutUrl)) addIssue(issues, item, 'blocker', 'active-bundle-checkout-disabled', `Active bundle ${id} must have checkout metadata.`, { file })
  }
}

function scanForForbiddenPublicFields(yaml, issues, item, indexPath) {
  for (const key of FORBIDDEN_PUBLIC_SYNC_KEYS) {
    const topLevel = new RegExp(`^${escapeRegExp(key)}:\\s*`, 'm')
    const productLevel = new RegExp(`^\\s{2}${escapeRegExp(key)}:\\s*`, 'm')
    const topLevelMatch = yaml.match(new RegExp(`^${escapeRegExp(key)}:\s*(.*)$`, 'm'))
    const productLevelMatch = yaml.match(new RegExp(`^\s{2}${escapeRegExp(key)}:\s*(.*)$`, 'm'))
    const rawValue = topLevelMatch?.[1] ?? productLevelMatch?.[1]
    const parsedValue = rawValue === undefined ? undefined : parseScalar(rawValue)
    if ((topLevel.test(yaml) || productLevel.test(yaml)) && parsedValue !== undefined && parsedValue !== '') {
      addIssue(issues, item, 'blocker', `forbidden-public-field-${key}`, `Public index.md must not expose non-empty ${key}.`, { file: toProjectPath(indexPath), field: key })
    }
  }
}

function writeFrontmatterUpdates(indexPath, rawIndex, split, updates) {
  let yaml = split.frontmatter
  for (const update of updates) {
    yaml = setYamlScalar(yaml, update.pagePath, update.value)
  }
  const nextRaw = `---\n${yaml.replace(/\n*$/u, '')}\n---\n${split.body.replace(/^\n*/u, '')}`
  if (nextRaw !== rawIndex.replace(/\r\n/g, '\n')) {
    writeFileSync(indexPath, nextRaw, 'utf8')
  }
}

function summarize(results) {
  const items = results.flatMap((result) => result.issues)
  const blockers = items.filter((issue) => issue.severity === 'blocker').length
  const warnings = items.filter((issue) => issue.severity === 'warning').length
  const infos = items.filter((issue) => issue.severity === 'info').length
  return { checked: results.length, blockers, warnings, infos, items }
}

function printText(summary) {
  for (const issue of summary.items) {
    const label = issue.severity.toUpperCase()
    console.log(`[product-sync] ${label} ${issue.slug}: ${issue.code}`)
    console.log(`  ${issue.message}`)
    if ('manifestValue' in issue || 'pageValue' in issue) {
      console.log(`  manifest: ${JSON.stringify(issue.manifestValue)}; page: ${JSON.stringify(issue.pageValue)}`)
    }
  }
  console.log(`[product-sync] Summary: products checked=${summary.checked}; blockers=${summary.blockers}; warnings=${summary.warnings}; infos=${summary.infos}`)
}

const results = getProductDirs().map(checkProduct)
if (options.mode === 'write') {
  for (const result of results) {
    if (result.write) result.write()
  }
}
const summary = summarize(results)

if (options.json) console.log(JSON.stringify(summary, null, 2))
else printText(summary)

const shouldFail = summary.blockers > 0 || (options.strict && summary.warnings > 0)
if (options.mode === 'check' && shouldFail) process.exit(1)
if (options.mode === 'write' && summary.blockers > 0) {
  console.error('[product-sync] --write applied public-safe fields. Re-run product:sync-check to confirm blockers are closed.')
}
