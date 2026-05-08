export type ParsedGalleryStripItem = {
  src: string
  caption: string
  thumb: string
  title: string
  meta: Record<string, string>
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function stripBullet(value: string): string {
  return value.replace(/^[-*+]\s+/, '').trim()
}

export function parseGalleryStripMeta(input: string): Record<string, string> {
  const meta: Record<string, string> = {}
  const chunks = (input || '')
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)

  for (const chunk of chunks) {
    const eq = chunk.indexOf('=')
    if (eq <= 0) continue
    const key = chunk.slice(0, eq).trim()
    const value = chunk.slice(eq + 1).trim()
    if (!key || !/^[a-zA-Z][\w.-]*$/.test(key)) continue
    meta[key] = value
  }

  return meta
}

export function parseGalleryStripItems(input: string): ParsedGalleryStripItem[] {
  const decoded = decodeHtmlEntities(input || '')
  return decoded
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .filter((line) => /^[-*+]\s+/.test(line))
    .map((line) => stripBullet(line))
    .map((line) => {
      const [src = '', caption = '', thumb = '', metaText = ''] = line.split('|').map((part) => part.trim())
      const meta = parseGalleryStripMeta(metaText)
      return { src, caption, thumb, title: meta.title || '', meta }
    })
    .filter((item) => item.src.length > 0)
}
