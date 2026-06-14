import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const SECTION_GAP_TOKEN = '[\uBB38\uB2E8\uB05D]'
const SECTION_GAP_TOKEN_ONLY_RE = /^\s*\[\uBB38\uB2E8\uB05D\]\s*$/
const SECTION_GAP_TOKEN_PREFIX_RE = /^\s*\[\uBB38\uB2E8\uB05D\]\s*(.+)$/
const FENCE_RE = /^\s*(```|~~~)/

const IMAGE_LINE_RE = /^!\[(?<alt>[^\]]*)\]\((?<target>.*)\)\s*$/
const BA_MARKER_RE = /^\s*\[(?<kind>\uC804|\uD6C4)\]\s*(?<label>.*)?$/

const BLOCKQUOTE_WIKILINK_RE = /^\s*>\s*\[\[(?<href>[^\]]+)\]\]\s*$/
const PAGECARD_CALLOUT_RE = /^\s*>\s*\[!pagecards\]\s*$/i
const BLOCKQUOTE_HREF_RE = /^\s*>\s*(?<href>\/[A-Za-z0-9\uAC00-\uD7A3._~/-]+)\s*$/
const LIST_MARKER_RE = /^\s*\[pagecards\]\s*$/i
const LIST_HREF_RE = /^\s*-\s*(?<href>\/[A-Za-z0-9\uAC00-\uD7A3._~/-]+)\s*$/
const PAGECARD_HREF_RE = /^\/[A-Za-z0-9\uAC00-\uD7A3._~/-]+$/

const BOX_CALLOUT_RE = /^\s*>\s*\[!(?<type>note|tip|warning|danger|quote|decision|ssot)\]\s*(?<title>.*)$/i
const BLOCKQUOTE_LINE_RE = /^\s*>\s?(?<body>.*)$/

export const LEGACY_ADAPTER_NAMES = Object.freeze([
  'section-gap',
  'before-after',
  'pagecard',
  'markdown-box',
])

function sectionGapDirective() {
  return ['::section-gap', 'size: md', '::'].join('\n')
}

function isFenceStart(line) {
  return FENCE_RE.test(line)
}

function isBlank(line) {
  return String(line || '').trim().length === 0
}

function splitFrontmatter(raw) {
  if (!raw.startsWith('---\n') && !raw.startsWith('---\r\n')) {
    return { prefix: '', body: raw }
  }

  const normalized = raw.replace(/\r\n/g, '\n')
  const closing = normalized.indexOf('\n---\n', 4)
  if (closing < 0) return { prefix: '', body: raw }

  const prefixEnd = closing + '\n---\n'.length
  return {
    prefix: normalized.slice(0, prefixEnd),
    body: normalized.slice(prefixEnd),
  }
}

function issue(adapter, code, line, message) {
  return { adapter, code, line, message }
}

function makeEntry(adapter, line, token, output) {
  return { adapter, line, token, output }
}

function makeReport(adapter, content, changed, converted, warnings, entries) {
  return { adapter, content, changed, converted, warnings, entries }
}

export function applyLegacySectionGapAdapter(content) {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const output = []
  const warnings = []
  const entries = []
  let changed = false
  let converted = 0
  let inFence = false

  lines.forEach((line, index) => {
    if (isFenceStart(line)) {
      inFence = !inFence
      output.push(line)
      return
    }

    if (inFence) {
      output.push(line)
      return
    }

    if (SECTION_GAP_TOKEN_ONLY_RE.test(line)) {
      const directive = sectionGapDirective()
      output.push(directive)
      changed = true
      converted += 1
      entries.push(makeEntry('section-gap', index + 1, SECTION_GAP_TOKEN, directive))
      return
    }

    const prefixMatch = line.match(SECTION_GAP_TOKEN_PREFIX_RE)
    if (prefixMatch) {
      const directive = sectionGapDirective()
      const rest = prefixMatch[1].trim()
      output.push(directive)
      output.push('')
      output.push(rest)
      changed = true
      converted += 1
      entries.push(makeEntry('section-gap', index + 1, SECTION_GAP_TOKEN, directive))
      return
    }

    output.push(line)
  })

  return makeReport('section-gap', output.join('\n'), changed, converted, warnings, entries)
}

function parseBaMarker(value) {
  const match = String(value || '').match(BA_MARKER_RE)
  if (!match?.groups?.kind) return null
  return { kind: match.groups.kind, label: (match.groups.label || '').trim() }
}

function parseImageTarget(target) {
  const trimmed = String(target || '').trim()
  if (!trimmed) return null
  const titleMatch = trimmed.match(/^(?<src>.+?)\s+["'](?<title>.*)["']\s*$/)
  if (titleMatch?.groups?.src) {
    return { src: titleMatch.groups.src.trim(), title: (titleMatch.groups.title || '').trim() }
  }
  return { src: trimmed, title: '' }
}

function parseImageLine(line) {
  const match = String(line || '').match(IMAGE_LINE_RE)
  if (!match?.groups?.target) return null
  const target = parseImageTarget(match.groups.target)
  if (!target?.src) return null
  return { alt: match.groups.alt || '', src: target.src, title: target.title }
}

function parseLegacyImageGroup(lines, index) {
  const image = parseImageLine(lines[index] || '')
  if (!image) return null

  const titleMarker = parseBaMarker(image.title)
  if (titleMarker) {
    return {
      kind: titleMarker.kind,
      src: image.src,
      label: titleMarker.label,
      startLine: index + 1,
      endLine: index + 1,
      nextIndex: index + 1,
    }
  }

  let markerIndex = index + 1
  let blanks = 0
  while (markerIndex < lines.length && isBlank(lines[markerIndex] || '') && blanks < 1) {
    markerIndex += 1
    blanks += 1
  }

  const marker = parseBaMarker(lines[markerIndex] || '')
  if (!marker) return null

  return {
    kind: marker.kind,
    src: image.src,
    label: marker.label,
    startLine: index + 1,
    endLine: markerIndex + 1,
    nextIndex: markerIndex + 1,
  }
}

function makeBeforeAfterDirective(before, after) {
  const labels = [before.label, after.label].filter(Boolean)
  const output = ['::before-after', `before: ${before.src}`, `after: ${after.src}`]
  if (labels.length) output.push(`caption: ${labels.join(' / ')}`)
  output.push('initial: 50')
  output.push('::')
  return output.join('\n')
}

function countBlankGap(lines, startIndex) {
  let index = startIndex
  let blanks = 0
  while (index < lines.length && isBlank(lines[index] || '')) {
    index += 1
    blanks += 1
  }
  return { index, blanks }
}

export function applyLegacyBeforeAfterAdapter(content) {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const output = []
  const warnings = []
  const entries = []
  let changed = false
  let converted = 0
  let inFence = false
  let i = 0

  while (i < lines.length) {
    const line = lines[i] || ''

    if (isFenceStart(line)) {
      inFence = !inFence
      output.push(line)
      i += 1
      continue
    }

    if (inFence) {
      output.push(line)
      i += 1
      continue
    }

    const group = parseLegacyImageGroup(lines, i)

    if (!group) {
      const marker = parseBaMarker(line)
      if (marker) {
        warnings.push(issue(
          'before-after',
          marker.kind === '\uC804' ? 'missing_before_image' : 'orphan_after_marker',
          i + 1,
          `Legacy [${marker.kind}] marker is not directly attached to a preceding image.`,
        ))
      }
      output.push(line)
      i += 1
      continue
    }

    if (group.kind === '\uD6C4') {
      warnings.push(issue('before-after', 'orphan_after_marker', group.startLine, 'Legacy [\uD6C4] image group appeared without a preceding [\uC804] group.'))
      output.push(...lines.slice(i, group.nextIndex))
      i = group.nextIndex
      continue
    }

    const gap = countBlankGap(lines, group.nextIndex)
    const afterGroup = parseLegacyImageGroup(lines, gap.index)

    if (!afterGroup) {
      const nextMarkerLine = lines.slice(group.nextIndex, Math.min(lines.length, group.nextIndex + 5)).findIndex((candidate) => Boolean(parseBaMarker(candidate)))
      warnings.push(issue(
        'before-after',
        nextMarkerLine >= 0 ? 'unsupported_marker_distance' : 'missing_after_image',
        group.startLine,
        'Legacy [\uC804] image group could not be paired with a safe [\uD6C4] image group.',
      ))
      output.push(...lines.slice(i, group.nextIndex))
      i = group.nextIndex
      continue
    }

    if (gap.blanks > 3) {
      warnings.push(issue('before-after', 'unsupported_marker_distance', afterGroup.startLine, 'Legacy [\uC804]/[\uD6C4] image groups are too far apart for safe conversion.'))
      output.push(...lines.slice(i, group.nextIndex))
      i = group.nextIndex
      continue
    }

    if (afterGroup.kind !== '\uD6C4') {
      warnings.push(issue('before-after', 'ambiguous_before_after_group', afterGroup.startLine, 'Legacy [\uC804] group was followed by another [\uC804] group; conversion skipped.'))
      output.push(...lines.slice(i, group.nextIndex))
      i = group.nextIndex
      continue
    }

    const directive = makeBeforeAfterDirective(group, afterGroup)
    output.push(directive)
    changed = true
    converted += 1
    entries.push(makeEntry('before-after', group.startLine, '[\uC804]/[\uD6C4]', directive))
    i = afterGroup.nextIndex
  }

  return makeReport('before-after', output.join('\n'), changed, converted, warnings, entries)
}

function isValidPagecardHref(href) {
  return PAGECARD_HREF_RE.test(String(href || '').trim())
}

function makePagecardDirective(items) {
  return ['::pagecard-grid', 'items:', ...items.map((item) => `  - ${item}`), '::'].join('\n')
}

function readBlockquoteWikilinks(lines, startIndex) {
  const first = lines[startIndex] || ''
  if (!BLOCKQUOTE_WIKILINK_RE.test(first)) return null
  const items = []
  let i = startIndex
  while (i < lines.length) {
    const match = (lines[i] || '').match(BLOCKQUOTE_WIKILINK_RE)
    if (!match?.groups?.href) break
    const href = match.groups.href.trim()
    if (!isValidPagecardHref(href)) break
    items.push(href)
    i += 1
  }
  return items.length ? { items, nextIndex: i } : null
}

function readPagecardCallout(lines, startIndex) {
  if (!PAGECARD_CALLOUT_RE.test(lines[startIndex] || '')) return null
  const items = []
  let i = startIndex + 1
  while (i < lines.length) {
    const line = lines[i] || ''
    if (isBlank(line)) break
    const match = line.match(BLOCKQUOTE_HREF_RE)
    if (!match?.groups?.href) break
    const href = match.groups.href.trim()
    if (!isValidPagecardHref(href)) break
    items.push(href)
    i += 1
  }
  return { items, nextIndex: i }
}

function readPagecardList(lines, startIndex) {
  if (!LIST_MARKER_RE.test(lines[startIndex] || '')) return null
  const items = []
  let i = startIndex + 1
  while (i < lines.length) {
    const line = lines[i] || ''
    if (isBlank(line)) break
    const match = line.match(LIST_HREF_RE)
    if (!match?.groups?.href) break
    const href = match.groups.href.trim()
    if (!isValidPagecardHref(href)) break
    items.push(href)
    i += 1
  }
  return { items, nextIndex: i }
}

export function applyLegacyPagecardAdapter(content) {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const output = []
  const warnings = []
  const entries = []
  let changed = false
  let converted = 0
  let inFence = false
  let i = 0

  while (i < lines.length) {
    const line = lines[i] || ''

    if (isFenceStart(line)) {
      inFence = !inFence
      output.push(line)
      i += 1
      continue
    }

    if (inFence) {
      output.push(line)
      i += 1
      continue
    }

    const group = readBlockquoteWikilinks(lines, i) || readPagecardCallout(lines, i) || readPagecardList(lines, i)
    if (!group) {
      output.push(line)
      i += 1
      continue
    }

    if (!group.items.length) {
      warnings.push(issue('pagecard', 'empty_pagecard_group', i + 1, 'Legacy pagecard marker did not include any valid href entries.'))
      output.push(...lines.slice(i, group.nextIndex))
      i = Math.max(group.nextIndex, i + 1)
      continue
    }

    const directive = makePagecardDirective(group.items)
    output.push(directive)
    changed = true
    converted += 1
    entries.push(makeEntry('pagecard', i + 1, 'pagecards', directive))
    i = group.nextIndex
  }

  return makeReport('pagecard', output.join('\n'), changed, converted, warnings, entries)
}

function stripBoxBodyLine(line) {
  const match = String(line || '').match(BLOCKQUOTE_LINE_RE)
  return match?.groups?.body ?? null
}

function makeBoxDirective(type, title, bodyLines) {
  const lines = ['::markdown-box', `type: ${type}`]
  if (title.trim()) lines.push(`title: ${title.trim()}`)
  lines.push('::')
  lines.push(...bodyLines)
  lines.push('::')
  return lines.join('\n')
}

export function applyLegacyBoxAdapter(content) {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const output = []
  const warnings = []
  const entries = []
  let changed = false
  let converted = 0
  let inFence = false
  let i = 0

  while (i < lines.length) {
    const line = lines[i] || ''

    if (isFenceStart(line)) {
      inFence = !inFence
      output.push(line)
      i += 1
      continue
    }

    if (inFence) {
      output.push(line)
      i += 1
      continue
    }

    const callout = line.match(BOX_CALLOUT_RE)
    if (!callout?.groups?.type) {
      output.push(line)
      i += 1
      continue
    }

    const type = callout.groups.type.toLowerCase()
    const title = callout.groups.title.trim()
    const bodyLines = []
    let nextIndex = i + 1

    while (nextIndex < lines.length) {
      const nextLine = lines[nextIndex] || ''
      if (isBlank(nextLine)) break
      const bodyLine = stripBoxBodyLine(nextLine)
      if (bodyLine === null) break
      bodyLines.push(bodyLine)
      nextIndex += 1
    }

    if (!title && !bodyLines.some((item) => item.trim())) {
      warnings.push(issue('markdown-box', 'empty_box_callout', i + 1, 'Legacy markdown-box callout did not include a title or body.'))
      output.push(line)
      i += 1
      continue
    }

    const directive = makeBoxDirective(type, title, bodyLines)
    output.push(directive)
    changed = true
    converted += 1
    entries.push(makeEntry('markdown-box', i + 1, `[!${type}]`, directive))
    i = nextIndex
  }

  return makeReport('markdown-box', output.join('\n'), changed, converted, warnings, entries)
}

export function runLegacyAdaptersOnBody(body) {
  const results = []
  let content = String(body || '')
  for (const adapter of [
    applyLegacySectionGapAdapter,
    applyLegacyBeforeAfterAdapter,
    applyLegacyPagecardAdapter,
    applyLegacyBoxAdapter,
  ]) {
    const result = adapter(content)
    results.push(result)
    content = result.content
  }

  const warnings = results.flatMap((result) => result.warnings)
  const entries = results.flatMap((result) => result.entries)
  return {
    original: body,
    markdown: content,
    changed: content !== body,
    entries,
    warnings,
    adapters: results.map((result) => ({
      adapter: result.adapter,
      converted: result.converted,
      warnings: result.warnings,
      changed: result.changed,
    })),
    totalConverted: results.reduce((sum, result) => sum + result.converted, 0),
    totalWarnings: warnings.length,
  }
}

export function runLegacyAdaptersOnRaw(raw) {
  const split = splitFrontmatter(String(raw || ''))
  const result = runLegacyAdaptersOnBody(split.body)
  return {
    ...result,
    raw: split.prefix + result.markdown,
    prefix: split.prefix,
  }
}

export function walkMarkdownFiles(rootDir) {
  const results = []
  if (!existsSync(rootDir)) return results

  for (const entry of readdirSync(rootDir, { withFileTypes: true })) {
    const fullPath = path.join(rootDir, entry.name)
    if (entry.isDirectory()) {
      results.push(...walkMarkdownFiles(fullPath))
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(fullPath)
    }
  }

  return results.sort()
}

export function readMarkdownFile(file) {
  return readFileSync(file, 'utf8')
}

export function writeMarkdownFile(file, content) {
  writeFileSync(file, content, 'utf8')
}

export function createFileAudit(file, projectRoot = process.cwd()) {
  const raw = readMarkdownFile(file)
  const result = runLegacyAdaptersOnRaw(raw)
  return {
    file,
    relativeFile: path.relative(projectRoot, file).replace(/\\/g, '/'),
    ...result,
  }
}
