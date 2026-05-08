import type { LegacyTransformReport } from './types'

export type LegacyBeforeAfterWarningCode =
  | 'orphan_before_marker'
  | 'orphan_after_marker'
  | 'unsupported_marker_distance'
  | 'ambiguous_before_after_group'
  | 'missing_before_image'
  | 'missing_after_image'

export type LegacyBeforeAfterWarning = {
  code: LegacyBeforeAfterWarningCode
  line: number
  message: string
}

type ImageLine = {
  alt: string
  src: string
  title: string
}

type MarkerKind = '전' | '후'

type LegacyImageGroup = {
  kind: MarkerKind
  src: string
  label: string
  startLine: number
  endLine: number
  nextIndex: number
}

export type LegacyBeforeAfterResult = {
  content: string
  report: LegacyTransformReport
  converted: number
  warnings: LegacyBeforeAfterWarning[]
}

const IMAGE_LINE_RE = /^!\[(?<alt>[^\]]*)\]\((?<target>.*)\)\s*$/
const MARKER_RE = /^\s*\[(?<kind>전|후)\]\s*(?<label>.*)?$/
const FENCE_RE = /^\s*(```|~~~)/
const MAX_IMAGE_TO_MARKER_BLANKS = 1
const MAX_GROUP_GAP_BLANKS = 3

function isFenceStart(line: string): boolean {
  return FENCE_RE.test(line)
}

function isBlank(line: string): boolean {
  return line.trim().length === 0
}

function parseMarker(value: string): { kind: MarkerKind; label: string } | null {
  const match = value.match(MARKER_RE)
  if (!match?.groups?.kind) return null
  return {
    kind: match.groups.kind as MarkerKind,
    label: (match.groups.label || '').trim(),
  }
}

function parseImageTarget(target: string): { src: string; title: string } | null {
  const trimmed = target.trim()
  if (!trimmed) return null

  const titleMatch = trimmed.match(/^(?<src>.+?)\s+["'](?<title>.*)["']\s*$/)
  if (titleMatch?.groups?.src) {
    return {
      src: titleMatch.groups.src.trim(),
      title: (titleMatch.groups.title || '').trim(),
    }
  }

  return {
    src: trimmed,
    title: '',
  }
}

function parseImageLine(line: string): ImageLine | null {
  const match = line.match(IMAGE_LINE_RE)
  if (!match?.groups?.target) return null
  const target = parseImageTarget(match.groups.target)
  if (!target?.src) return null
  return {
    alt: match.groups.alt || '',
    src: target.src,
    title: target.title,
  }
}

function parseTitleMarker(title: string): { kind: MarkerKind; label: string } | null {
  return parseMarker(title)
}

function parseLegacyImageGroup(lines: string[], index: number): LegacyImageGroup | null {
  const image = parseImageLine(lines[index] || '')
  if (!image) return null

  const titleMarker = parseTitleMarker(image.title)
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
  while (markerIndex < lines.length && isBlank(lines[markerIndex] || '') && blanks < MAX_IMAGE_TO_MARKER_BLANKS) {
    markerIndex += 1
    blanks += 1
  }

  const marker = parseMarker(lines[markerIndex] || '')
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

function makeBeforeAfterDirective(before: LegacyImageGroup, after: LegacyImageGroup): string {
  const labels = [before.label, after.label].filter(Boolean)
  const output = [
    '::before-after',
    `before: ${before.src}`,
    `after: ${after.src}`,
  ]

  if (labels.length) output.push(`caption: ${labels.join(' / ')}`)
  output.push('initial: 50')
  output.push('::')

  return output.join('\n')
}

function countBlankGap(lines: string[], startIndex: number): { index: number; blanks: number } {
  let index = startIndex
  let blanks = 0
  while (index < lines.length && isBlank(lines[index] || '')) {
    index += 1
    blanks += 1
  }
  return { index, blanks }
}

export function applyLegacyBeforeAfterAdapter(content: string): LegacyBeforeAfterResult {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const output: string[] = []
  const warnings: LegacyBeforeAfterWarning[] = []
  const report: LegacyTransformReport = {
    changed: false,
    items: [],
  }

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
      const marker = parseMarker(line)
      if (marker) {
        warnings.push({
          code: marker.kind === '전' ? 'missing_before_image' : 'orphan_after_marker',
          line: i + 1,
          message: `Legacy [${marker.kind}] marker is not directly attached to a preceding image.`,
        })
      }

      output.push(line)
      i += 1
      continue
    }

    if (group.kind === '후') {
      warnings.push({
        code: 'orphan_after_marker',
        line: group.startLine,
        message: 'Legacy [후] image group appeared without a preceding [전] group.',
      })
      output.push(...lines.slice(i, group.nextIndex))
      i = group.nextIndex
      continue
    }

    const gap = countBlankGap(lines, group.nextIndex)
    const afterGroup = parseLegacyImageGroup(lines, gap.index)

    if (!afterGroup) {
      const nextMarkerLine = lines.slice(group.nextIndex, Math.min(lines.length, group.nextIndex + MAX_GROUP_GAP_BLANKS + 2)).findIndex((candidate) => Boolean(parseMarker(candidate)))
      warnings.push({
        code: nextMarkerLine >= 0 ? 'unsupported_marker_distance' : 'missing_after_image',
        line: group.startLine,
        message: 'Legacy [전] image group could not be paired with a safe [후] image group.',
      })
      output.push(...lines.slice(i, group.nextIndex))
      i = group.nextIndex
      continue
    }

    if (gap.blanks > MAX_GROUP_GAP_BLANKS) {
      warnings.push({
        code: 'unsupported_marker_distance',
        line: afterGroup.startLine,
        message: 'Legacy [전]/[후] image groups are too far apart for safe conversion.',
      })
      output.push(...lines.slice(i, group.nextIndex))
      i = group.nextIndex
      continue
    }

    if (afterGroup.kind !== '후') {
      warnings.push({
        code: 'ambiguous_before_after_group',
        line: afterGroup.startLine,
        message: 'Legacy [전] group was followed by another [전] group; conversion skipped.',
      })
      output.push(...lines.slice(i, group.nextIndex))
      i = group.nextIndex
      continue
    }

    const directive = makeBeforeAfterDirective(group, afterGroup)
    output.push(directive)

    report.changed = true
    report.items.push({
      kind: 'before-after-legacy-marker',
      line: group.startLine,
      token: '[전]/[후]',
      output: directive,
    })
    converted += 1
    i = afterGroup.nextIndex
  }

  return {
    content: output.join('\n'),
    report,
    converted,
    warnings,
  }
}
