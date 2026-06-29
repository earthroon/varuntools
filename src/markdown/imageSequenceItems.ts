export type ImageSequenceTemplateItem = {
  assetId?: string
  src: string
  alt: string
  caption?: string
  width?: number
  height?: number
  filename?: string
  mimeType?: string
}

function asString(value: unknown): string {
  return String(value ?? '').trim()
}

function normalizePositiveInteger(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return undefined
  const rounded = Math.floor(parsed)
  return rounded > 0 ? rounded : undefined
}

function normalizeItem(value: unknown): ImageSequenceTemplateItem | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const src = asString(record.src)
  const alt = asString(record.alt)
  if (!src || !alt) return null

  return {
    assetId: asString(record.assetId) || undefined,
    src,
    alt,
    caption: asString(record.caption) || undefined,
    width: normalizePositiveInteger(record.width),
    height: normalizePositiveInteger(record.height),
    filename: asString(record.filename) || undefined,
    mimeType: asString(record.mimeType) || undefined,
  }
}

export function parseImageSequenceTemplateItems(value: string): ImageSequenceTemplateItem[] {
  let parsed: unknown

  try {
    parsed = JSON.parse(value || '[]')
  } catch {
    return []
  }

  if (!Array.isArray(parsed)) return []

  return parsed
    .map((item) => normalizeItem(item))
    .filter((item): item is ImageSequenceTemplateItem => Boolean(item))
}
