#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const failures = []

function read(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : ''
}

function check(label, ok) {
  if (!ok) failures.push(label)
}

function normalizeLine(value) {
  return String(value || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function sanitizeText(value) {
  return normalizeLine(String(value || '')).replace(/\n/g, ' ').trim()
}

function optionalText(value) {
  const clean = sanitizeText(value)
  return clean || undefined
}

function positiveInteger(value) {
  if (value === undefined || value === null || value === '') return undefined
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return undefined
  const rounded = Math.floor(parsed)
  return rounded > 0 ? rounded : undefined
}

function parseAttrs(value) {
  const attrs = {}
  const source = String(value || '')
  const re = /([a-zA-Z][a-zA-Z0-9_-]*)=("([^"]*)"|'([^']*)'|([^\s}]+))/g
  let match = re.exec(source)
  while (match) {
    const key = match[1]
    const next = match[3] ?? match[4] ?? match[5] ?? ''
    attrs[key] = next
    match = re.exec(source)
  }
  return attrs
}

function parseItemAttrs(chunk) {
  const attrs = {}
  const allowed = new Set(['assetId', 'src', 'alt', 'caption', 'width', 'height', 'filename', 'mimeType'])

  for (const line of normalizeLine(chunk).split('\n')) {
    const match = line.match(/^([a-zA-Z][a-zA-Z0-9_-]*):\s*(.*)$/u)
    if (!match) continue

    const key = match[1] || ''
    if (!allowed.has(key)) continue
    attrs[key] = match[2] || ''
  }

  return attrs
}

function parseItems(body) {
  const chunks = normalizeLine(body)
    .split(/^---\s*$/mu)
    .map((chunk) => chunk.trim())
    .filter(Boolean)

  const items = []
  for (const chunk of chunks) {
    const attrs = parseItemAttrs(chunk)
    const item = {
      assetId: optionalText(attrs.assetId),
      src: sanitizeText(attrs.src),
      alt: sanitizeText(attrs.alt),
      caption: optionalText(attrs.caption),
      width: positiveInteger(attrs.width),
      height: positiveInteger(attrs.height),
      filename: optionalText(attrs.filename),
      mimeType: optionalText(attrs.mimeType),
    }

    if (!item.src || !item.alt) continue
    items.push(item)
  }

  return items
}

function dataAttr(name, value) {
  if (value === undefined || value === null || value === '') return ''
  return ' data-' + name + '="' + escapeHtml(String(value)) + '"'
}

function renderImageSequence(attrs, items) {
  const layout = attrs.layout === 'crop-strip' ? 'crop-strip' : 'crop-strip'
  const reserved = attrs.reserved === undefined ? 'true' : String(attrs.reserved)
  const lazy = attrs.lazy === undefined ? 'true' : String(attrs.lazy)
  const fade = attrs.fade === undefined ? 'true' : String(attrs.fade)
  const width = positiveInteger(attrs.width)
  const height = positiveInteger(attrs.height)

  let html = '<image-sequence'
  html += dataAttr('layout', layout)
  html += dataAttr('reserved', reserved)
  html += dataAttr('lazy', lazy)
  html += dataAttr('fade', fade)
  if (width) html += dataAttr('width', width)
  if (height) html += dataAttr('height', height)
  html += '>'
  html += '<template data-image-sequence-items>' + escapeHtml(JSON.stringify(items)) + '</template>'
  html += '</image-sequence>'
  return html
}

const fixturePath = 'scripts/fixtures/cms-image-sequence-page.md'
const fixture = read(fixturePath)

check('fixture markdown exists', fs.existsSync(fixturePath))
check('fixture contains :::image-sequence', fixture.includes(':::image-sequence'))
check('fixture contains /assets/content/', fixture.includes('/assets/content/'))
check('fixture contains at least two src rows', (fixture.match(/^src:\s+/gmu) || []).length >= 2)

const directiveMatch = fixture.match(/:::image-sequence\{([^}]*)\}\s*\n([\s\S]*?)\n:::/u)
check('fixture has parseable image-sequence directive block', Boolean(directiveMatch))

const attrs = directiveMatch ? parseAttrs(directiveMatch[1] || '') : {}
const items = directiveMatch ? parseItems(directiveMatch[2] || '') : []
check('fixture image-sequence has at least two parsed items', items.length >= 2)
check('parsed items preserve order', items[0]?.assetId === 'cms-fixture-001' && items[1]?.assetId === 'cms-fixture-002')

const output = renderImageSequence(attrs, items)

check('render output contains <image-sequence', output.includes('<image-sequence'))
check('render output contains data-image-sequence-items', output.includes('data-image-sequence-items'))
check('render output contains escaped JSON payload', output.includes('&quot;assetId&quot;'))
check('render output contains assetId', output.includes('cms-fixture-001') && output.includes('cms-fixture-002'))
check('render output contains width and height', output.includes('&quot;width&quot;') && output.includes('&quot;height&quot;'))
check('render output contains /assets/content/', output.includes('/assets/content/'))

const forbiddenImageTokens = [
  'srcset',
  'sizes',
  '<picture',
  '<source',
  'canvas',
  'ImageBitmap',
  'createImageBitmap',
  'OffscreenCanvas',
  'imageOptimizer',
  'optimizer',
  'transform',
  'thumbnail',
  'blurData',
  'lqip',
  'EWA',
  'ewa',
  'webgpu',
  'wgpu',
]

for (const token of forbiddenImageTokens) {
  check('render output forbidden image token absent: ' + token, !output.includes(token))
}

const forbiddenCouplingTokens = [
  'database',
  'bucket',
  'listObjects',
  'getObject',
  'prepare(',
  'SELECT',
  'cms-admin',
]

for (const token of forbiddenCouplingTokens) {
  check('render output forbidden coupling token absent: ' + token, !output.includes(token))
}

const receiptDir = path.join('node_modules', '.cache', 'varuntools', 'vt-cms-04')
fs.mkdirSync(receiptDir, { recursive: true })
fs.writeFileSync(path.join(receiptDir, 'cms-image-sequence-e2e-render.html'), output + '\n', 'utf8')
fs.writeFileSync(
  path.join(receiptDir, 'cms-image-sequence-e2e-render.json'),
  JSON.stringify({ patch: 'VT-CMS-04', items: items.length, outputLength: output.length }, null, 2) + '\n',
  'utf8',
)

if (failures.length) {
  console.error('FAIL_VARUNTOOLS_CMS_IMAGE_SEQUENCE_E2E_RENDER')
  for (const failure of failures) console.error('- ' + failure)
  process.exit(1)
}

console.log('PASS_VARUNTOOLS_CMS_IMAGE_SEQUENCE_E2E_RENDER')
