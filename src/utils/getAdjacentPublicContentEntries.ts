import type { PublicContentCardEntry } from '@/composables/usePublicContentCollection'

export type PublicContentAdjacentEntries = {
  previous: PublicContentCardEntry | null
  next: PublicContentCardEntry | null
}

export function normalizePublicContentAdjacentKey(value: string): string {
  const withoutOrigin = String(value || '').trim().replace(/^https?:\/\/[^/]+/i, '')
  return withoutOrigin
    .split('#')[0]
    .split('?')[0]
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
}

function publicContentEntryKeys(entry: PublicContentCardEntry): string[] {
  return [entry.slug, entry.href, entry.contentDir]
    .map(normalizePublicContentAdjacentKey)
    .filter((key) => Boolean(key))
}

export function getAdjacentPublicContentEntries(
  entries: PublicContentCardEntry[],
  currentRoute: string,
): PublicContentAdjacentEntries {
  const currentKey = normalizePublicContentAdjacentKey(currentRoute)
  if (!currentKey) return { previous: null, next: null }

  const index = entries.findIndex((entry) => publicContentEntryKeys(entry).includes(currentKey))
  if (index < 0) return { previous: null, next: null }

  return {
    previous: entries[index - 1] || null,
    next: entries[index + 1] || null,
  }
}
