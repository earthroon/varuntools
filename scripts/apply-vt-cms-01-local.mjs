#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const projectRoot = process.cwd()

function readText(relativePath) {
  return fs.readFileSync(path.resolve(projectRoot, relativePath), 'utf8')
}

function writeText(relativePath, text) {
  const target = path.resolve(projectRoot, relativePath)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, text, 'utf8')
}

function ensureFile(relativePath) {
  const target = path.resolve(projectRoot, relativePath)
  if (!fs.existsSync(target)) throw new Error(`missing file: ${relativePath}`)
}

function ensureDirectiveTypes() {
  const relativePath = 'src/markdown/directiveTypes.ts'
  ensureFile(relativePath)
  let source = readText(relativePath)

  if (!source.includes("| 'image-sequence'")) {
    if (!source.includes("| 'demo-frame'")) throw new Error('DirectiveName demo-frame anchor missing')
    source = source.replace("| 'demo-frame'", "| 'demo-frame'\n  | 'image-sequence'")
  }

  const knownToken = "'image-sequence',"
  if (!source.includes(knownToken)) {
    if (!source.includes("  'demo-frame',")) throw new Error('KNOWN_DIRECTIVES demo-frame anchor missing')
    source = source.replace("  'demo-frame',", "  'demo-frame',\n  'image-sequence',")
  }

  writeText(relativePath, source)
}

const imageSequenceDirectiveSource = `import type { DirectiveFieldValue, ParsedDirective } from '../directiveTypes'
import { attrsToHtml, escapeHtml, renderInvalidDirective } from '../directiveHtml'

export type ImageSequenceDirectiveItem = {
  assetId?: string
  src: string
  alt: string
  caption?: string
  width?: number
  height?: number
  filename?: string
  mimeType?: string
}

const IMAGE_SEQUENCE_LAYOUTS = new Set(['crop-strip'])

function normalizeLine(value: string): string {
  return String(value ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

function sanitizeValue(value: unknown): string {
  return normalizeLine(String(value ?? '')).replace(/\n/g, ' ').trim()
}

function optionalValue(value: unknown): string | undefined {
  const clean = sanitizeValue(value)
  return clean || undefined
}

function positiveInteger(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return undefined
  const rounded = Math.floor(parsed)
  return rounded > 0 ? rounded : undefined
}

function parseBooleanAttr(value: unknown, fallback: boolean): boolean | null {
  if (value === undefined || value === null || value === '') return fallback
  if (typeof value === 'boolean') return value
  const clean = sanitizeValue(value).toLowerCase()
  if (clean === 'true' || clean === '1' || clean === 'yes') return true
  if (clean === 'false' || clean === '0' || clean === 'no') return false
  return null
}

function parseLayout(value: unknown): 'crop-strip' | null {
  const clean = sanitizeValue(value || 'crop-strip').toLowerCase()
  return IMAGE_SEQUENCE_LAYOUTS.has(clean) ? 'crop-strip' : null
}

function parseItemChunk(chunk: string): ImageSequenceDirectiveItem | null {
  const attrs: Record<string, string> = {}
  for (const line of normalizeLine(chunk).split('\n')) {
    const match = line.match(/^([a-zA-Z][a-zA-Z0-9_-]*):\\s*(.*)$/u)
    if (!match) continue
    attrs[match[1]] = match[2]
  }

  const src = sanitizeValue(attrs.src)
  const alt = sanitizeValue(attrs.alt)
  const item: ImageSequenceDirectiveItem = {
    assetId: optionalValue(attrs.assetId),
    src,
    alt,
    caption: optionalValue(attrs.caption),
    width: positiveInteger(attrs.width),
    height: positiveInteger(attrs.height),
    filename: optionalValue(attrs.filename),
    mimeType: optionalValue(attrs.mimeType),
  }

  if (!item.assetId && !item.src && !item.alt && !item.caption && !item.width && !item.height && !item.filename && !item.mimeType) return null
  return item
}

function parseImageSequenceItems(body: string): ImageSequenceDirectiveItem[] {
  return normalizeLine(body)
    .split(/^---\\s*$/mu)
    .map((chunk) => parseItemChunk(chunk.trim()))
    .filter((item): item is ImageSequenceDirectiveItem => Boolean(item))
}

function validateItems(items: ImageSequenceDirectiveItem[]): string | null {
  if (!items.length) return 'missing_items'
  for (const [index, item] of items.entries()) {
    if (!item.src) return 'missing_src_' + String(index + 1)
    if (!item.alt) return 'missing_alt_' + String(index + 1)
  }
  return null
}

function pushAttr(attrs: Record<string, DirectiveFieldValue>, key: string, value: DirectiveFieldValue | undefined): void {
  if (value === undefined || value === null) return
  if (typeof value === 'string' && !value.trim()) return
  attrs[key] = value
}

export function renderImageSequenceDirective(directive: ParsedDirective): string {
  const layout = parseLayout(directive.attrs.layout)
  if (!layout) return renderInvalidDirective('image-sequence', 'invalid_layout')

  const reserved = parseBooleanAttr(directive.attrs.reserved, true)
  if (reserved === null) return renderInvalidDirective('image-sequence', 'invalid_reserved')

  const lazy = parseBooleanAttr(directive.attrs.lazy, true)
  if (lazy === null) return renderInvalidDirective('image-sequence', 'invalid_lazy')

  const fade = parseBooleanAttr(directive.attrs.fade, true)
  if (fade === null) return renderInvalidDirective('image-sequence', 'invalid_fade')

  const width = positiveInteger(directive.attrs.width)
  if (directive.attrs.width !== undefined && !width) return renderInvalidDirective('image-sequence', 'invalid_width')

  const height = positiveInteger(directive.attrs.height)
  if (directive.attrs.height !== undefined && !height) return renderInvalidDirective('image-sequence', 'invalid_height')

  const items = parseImageSequenceItems(directive.body)
  const itemError = validateItems(items)
  if (itemError) return renderInvalidDirective('image-sequence', itemError)

  const attrs: Record<string, DirectiveFieldValue> = {
    layout,
    reserved,
    lazy,
    fade,
  }
  pushAttr(attrs, 'width', width)
  pushAttr(attrs, 'height', height)

  return '<image-sequence ' + attrsToHtml(attrs) + '><template data-image-sequence-items>' + escapeHtml(JSON.stringify(items)) + '</template></image-sequence>'
}
`

function ensureImageSequenceDirective() {
  writeText('src/markdown/directives/imageSequenceDirective.ts', imageSequenceDirectiveSource)
}

function ensureDirectiveIndex() {
  const relativePath = 'src/markdown/directives/index.ts'
  ensureFile(relativePath)
  let source = readText(relativePath)

  if (!source.includes("renderImageSequenceDirective")) {
    const anchor = "import { renderGalleryStripDirective } from './galleryStripDirective'"
    if (!source.includes(anchor)) throw new Error('directive index gallery strip import anchor missing')
    source = source.replace(anchor, `${anchor}\nimport { renderImageSequenceDirective } from './imageSequenceDirective'`)
  }

  if (!source.includes("case 'image-sequence':")) {
    const anchor = "    case 'gallery-strip':\n      return renderGalleryStripDirective(directive)"
    if (!source.includes(anchor)) throw new Error('directive index gallery-strip case anchor missing')
    source = source.replace(anchor, `${anchor}\n\n    case 'image-sequence':\n      return renderImageSequenceDirective(directive)`)
  }

  writeText(relativePath, source)
}

function ensurePackageScript() {
  const relativePath = 'package.json'
  ensureFile(relativePath)
  const json = JSON.parse(readText(relativePath))
  json.scripts = json.scripts || {}
  json.scripts['smoke:cms-image-sequence-directive'] = 'node scripts/smoke-cms-image-sequence-directive-contract.mjs'
  writeText(relativePath, JSON.stringify(json, null, 2) + '\n')
}

function ensureDocs() {
  writeText('docs/CMS_IMAGE_SEQUENCE_PUBLIC_CONTRACT.md', `# CMS Image Sequence Public Contract

Patch: VT-CMS-01

This document defines the public markdown contract for the CMS image sequence directive.

## Scope

The public repo accepts the published \`::image-sequence\` directive and serializes it into an \`<image-sequence>\` custom element with a \`<template data-image-sequence-items>\` JSON payload.

This patch does not add runtime mounting and does not optimize images.

## Input

\`\`\`txt
::image-sequence
layout: crop-strip
reserved: true
lazy: true
fade: true
::
assetId: asset_001
src: /assets/content/pages/demo/crop-001.webp
width: 1200
height: 800
filename: crop-001.webp
mimeType: image/webp
alt: first image
caption: optional caption
---
assetId: asset_002
src: /assets/content/pages/demo/crop-002.webp
alt: second image
::
\`\`\`

## Output

\`\`\`html
<image-sequence data-layout="crop-strip" data-reserved="true" data-lazy="true" data-fade="true"><template data-image-sequence-items>[...]</template></image-sequence>
\`\`\`

## Non-goals

- No ImageSequence.vue.
- No mountMarkdownComponents.ts change.
- No image optimization.
- No D1 lookup.
- No R2 list.
`)
}

ensureDirectiveTypes()
ensureImageSequenceDirective()
ensureDirectiveIndex()
ensurePackageScript()
ensureDocs()

console.log('PASS_VT_CMS_01_APPLY_OVERLAY')
