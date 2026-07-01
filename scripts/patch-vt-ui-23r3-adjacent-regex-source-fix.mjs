import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const file = 'src/utils/getAdjacentPublicContentEntries.ts'
const target = path.join(root, file)

fs.mkdirSync(path.dirname(target), { recursive: true })

const source = String.raw`import type { PublicContentCardEntry } from '@/composables/usePublicContentCollection'

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
`

fs.writeFileSync(target, source, 'utf8')

const updated = fs.readFileSync(target, 'utf8')
const checks = [
  ['escaped https regex', "replace(/^https?:\\/\\/[^/]+/i, '')"],
  ['escaped backslash regex', 'replace(/\\\\/g, \'/\')'],
  ['escaped leading slash regex', "replace(/^\\/+/, '')"],
  ['escaped trailing slash regex', "replace(/\\/+$/, '')"],
  ['adjacent export', 'export function getAdjacentPublicContentEntries'],
]

let failed = false
for (const [label, token] of checks) {
  if (!updated.includes(token)) {
    console.error(`${file} missing ${label}: ${token}`)
    failed = true
  }
}

if (failed) {
  console.error('FAIL_VT_UI_23R3R1_ADJACENT_REGEX_SOURCE_FIX')
  process.exit(1)
}

console.log('PASS_VT_UI_23R3R1_ADJACENT_REGEX_SOURCE_FIX')
