import { computed, onMounted, ref } from 'vue'
import type { PublicContentCardEntry } from '@/composables/usePublicContentCollection'
import { afterFirstPaintAsync } from '@/utils/afterFirstPaint'

export type RuntimePublicContentIndexEntry = PublicContentCardEntry & {
  categoryLabel?: string
  time?: number
  source?: string
  sourcePath?: string
}

export type RuntimePublicContentIndex = {
  schemaVersion: string
  patchId?: string
  generatedAt?: string
  source?: string
  entries: RuntimePublicContentIndexEntry[]
}

export type RuntimePublicContentIndexStatus = 'idle' | 'loading' | 'ready' | 'fallback' | 'error'

const runtimeEntries = ref<RuntimePublicContentIndexEntry[]>([])
const runtimeStatus = ref<RuntimePublicContentIndexStatus>('idle')
const runtimeError = ref('')
const runtimeGeneratedAt = ref('')
let inflight: Promise<void> | null = null
let cleanupDeferredFetch: (() => void) | null = null

function readString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function readBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value === '1' || value.toLowerCase() === 'true'
  return false
}

function readNumber(value: unknown, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function readTags(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item || '').trim()).filter(Boolean) : []
}

function shouldSkipRuntimePublicContentIndexFetch(): boolean {
  if (typeof navigator === 'undefined') return false
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } }
  return Boolean(nav.connection?.saveData)
}

function normalizeEntry(raw: Record<string, unknown>): RuntimePublicContentIndexEntry {
  const slug = readString(raw.slug).trim()
  const href = readString(raw.href).trim() || (slug ? '/' + slug : '')
  const category = readString(raw.category).trim() || 'page'
  const kind = readString(raw.kind).trim() || category
  const cover = readString(raw.cover).trim()

  return {
    slug,
    href,
    title: readString(raw.title).trim() || slug,
    description: readString(raw.description).trim(),
    category,
    categoryLabel: readString(raw.categoryLabel).trim() || category,
    kind,
    collection: readString(raw.collection).trim() || kind,
    tags: readTags(raw.tags),
    order: readNumber(raw.order, 9999),
    featured: readBoolean(raw.featured),
    cover,
    thumbnail: readString(raw.thumbnail).trim() || cover,
    contentDir: readString(raw.contentDir).trim() || slug,
    status: readString(raw.status).trim() || 'active',
    visibility: readString(raw.visibility).trim() || 'public',
    year: Number.isFinite(Number(raw.year)) ? Number(raw.year) : undefined,
    time: Number.isFinite(Number(raw.time)) ? Number(raw.time) : undefined,
    source: readString(raw.source).trim(),
    sourcePath: readString(raw.sourcePath).trim(),
  }
}

async function fetchRuntimePublicContentIndex(): Promise<void> {
  if (shouldSkipRuntimePublicContentIndexFetch()) {
    runtimeStatus.value = 'fallback'
    runtimeError.value = 'runtime public content index skipped because Save-Data is enabled'
    return
  }

  runtimeStatus.value = 'loading'
  runtimeError.value = ''

  try {
    const response = await fetch('/public-content-index.json', {
      cache: 'force-cache',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) throw new Error(`public content index request failed: ${response.status}`)

    const data = await response.json() as RuntimePublicContentIndex
    if (!data || data.schemaVersion !== 'cms-public-content-index.v1' || !Array.isArray(data.entries)) {
      throw new Error('public content index response schema mismatch')
    }

    const entries = data.entries
      .map((entry) => normalizeEntry(entry as unknown as Record<string, unknown>))
      .filter((entry) => entry.slug && entry.href && entry.visibility === 'public')

    if (!entries.length) throw new Error('public content index returned no usable entries')

    runtimeEntries.value = entries
    runtimeGeneratedAt.value = readString(data.generatedAt)
    runtimeStatus.value = 'ready'
  } catch (error) {
    runtimeEntries.value = []
    runtimeError.value = error instanceof Error ? error.message : String(error)
    runtimeStatus.value = 'fallback'
    console.warn('[VARUNTOOLS][04M-B1] runtime public content index fallback:', runtimeError.value)
  }
}

function queueRuntimePublicContentIndexFetch(): void {
  if (runtimeStatus.value !== 'idle' || inflight) return

  cleanupDeferredFetch?.()
  cleanupDeferredFetch = afterFirstPaintAsync(async () => {
    if (runtimeStatus.value !== 'idle' || inflight) return
    inflight = fetchRuntimePublicContentIndex().finally(() => {
      inflight = null
    })
    await inflight
  }, 1200)
}

export function useRuntimePublicContentIndex() {
  async function reloadRuntimePublicContentIndex(): Promise<void> {
    cleanupDeferredFetch?.()
    cleanupDeferredFetch = null
    inflight = fetchRuntimePublicContentIndex().finally(() => {
      inflight = null
    })
    await inflight
  }

  onMounted(() => {
    queueRuntimePublicContentIndexFetch()
  })

  return {
    runtimeEntries: computed(() => runtimeEntries.value),
    runtimeStatus,
    runtimeError,
    runtimeGeneratedAt,
    reloadRuntimePublicContentIndex,
  }
}
