<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { LoadedMarkdownPage } from '@/markdown/types'
import { getFeaturedWorkEntries, toWorkCardEntry } from '@/markdown/pageRegistry'
import { loadAllMarkdownPages, loadMarkdownPageBySlug } from '@/markdown/lazyMarkdownPageLoader'
import WorkCard from './WorkCard.vue'
import { resolveNavigationTarget } from '@/navigation/navigationTarget'

type ManualFeaturedWorkItem = {
  id: string
  title: string
  href: string
  label: string
}

type FeaturedWorkResolution = 'loading' | 'resolved' | 'missing' | 'external'

type FeaturedWorkEntry = {
  slug: string
  title: string
  description: string
  cover: string
  href: string
  kind: string
  contentDir: string
  resolution: FeaturedWorkResolution
  sourceHref: string
}

const props = withDefaults(
  defineProps<{
    pages: LoadedMarkdownPage[]
    title?: string
    kind?: string
    items?: string[]
    layout?: string
    limit?: number
  }>(),
  {
    title: '',
    kind: '',
    items: () => [],
    layout: 'grid',
    limit: 12,
  },
)

function trimSlash(value: string): string {
  return String(value || '').trim().replace(/^\/+|\/+$/g, '')
}

function normalizeHref(value: string, fallbackId = ''): string {
  const href = String(value || '').trim()
  if (/^(https?:\/\/|\/)/i.test(href)) return href

  const id = trimSlash(href || fallbackId)
  if (!id) return '#'
  if (id.includes('/')) return '/' + id
  return '/works/' + id
}

function parseManualItem(value: string): ManualFeaturedWorkItem | null {
  const [id = '', title = '', href = '', label = ''] = String(value || '')
    .split('|')
    .map((part) => part.trim())

  const cleanId = trimSlash(id)
  const cleanTitle = title.trim()
  const normalizedHref = normalizeHref(href, cleanId)

  if (!cleanId && !cleanTitle && normalizedHref === '#') return null

  return {
    id: cleanId || trimSlash(normalizedHref) || cleanTitle,
    title: cleanTitle,
    href: normalizedHref,
    label: label.trim(),
  }
}

function normalizeIdentity(value: string): string {
  return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase()
}

function normalizeMigrationTitleIdentity(value: string): string {
  return normalizeIdentity(value).replace(/\s+/g, '')
}

function resolveManualRegistryEntry(
  item: ManualFeaturedWorkItem,
  registryEntries: ReturnType<typeof toWorkCardEntry>[],
  allowTitleMigration = true,
) {
  const normalizedId = trimSlash(item.id)
  const itemTarget = resolveNavigationTarget(item.href)
  const normalizedHref = trimSlash(itemTarget.routePath || item.href)
  const direct = registryEntries.find((entry) => {
    return (
      trimSlash(entry.slug) === normalizedId ||
      trimSlash(entry.href) === normalizedHref ||
      trimSlash(entry.slug) === normalizedHref ||
      trimSlash(entry.href) === normalizedId
    )
  })
  if (direct) return direct
  if (!allowTitleMigration) return undefined

  const titleIdentity = normalizeMigrationTitleIdentity(item.title || item.id)
  if (!titleIdentity) return undefined
  const titleMatches = registryEntries.filter(
    (entry) => normalizeMigrationTitleIdentity(entry.title) === titleIdentity,
  )
  return titleMatches.length === 1 ? titleMatches[0] : undefined
}

function canonicalManualHref(
  item: ManualFeaturedWorkItem,
  registryEntry: ReturnType<typeof toWorkCardEntry> | undefined,
): string {
  const target = resolveNavigationTarget(item.href)
  if (target.kind === 'internal' && registryEntry) return registryEntry.href
  return item.href || registryEntry?.href || '#'
}

function materializeManualEntry(
  item: ManualFeaturedWorkItem,
  registryEntry: ReturnType<typeof toWorkCardEntry> | undefined,
  resolution: FeaturedWorkResolution,
): FeaturedWorkEntry {
  const normalizedId = trimSlash(item.id)
  const normalizedHref = trimSlash(item.href)
  return {
    slug: registryEntry?.slug || normalizedId || normalizedHref,
    title: item.title || registryEntry?.title || normalizedId || 'Untitled',
    description: registryEntry?.description || '',
    cover: registryEntry?.cover || '',
    href: canonicalManualHref(item, registryEntry),
    kind: item.label || registryEntry?.kind || props.kind || '',
    contentDir: registryEntry?.contentDir || '',
    resolution,
    sourceHref: item.href,
  }
}

const manualItems = computed(() =>
  props.items
    .map(parseManualItem)
    .filter((item): item is ManualFeaturedWorkItem => Boolean(item)),
)
const manualEntries = ref<FeaturedWorkEntry[]>([])
let resolutionEpoch = 0
let disposed = false

async function resolveManualItem(
  item: ManualFeaturedWorkItem,
  parentRegistryEntries: ReturnType<typeof toWorkCardEntry>[],
): Promise<FeaturedWorkEntry> {
  const target = resolveNavigationTarget(item.href)
  const fromParent = resolveManualRegistryEntry(item, parentRegistryEntries)

  if (target.kind !== 'internal') {
    return materializeManualEntry(item, fromParent, 'external')
  }
  if (fromParent) {
    return materializeManualEntry(item, fromParent, 'resolved')
  }

  const targetSlug = trimSlash(target.routePath || item.href)
  try {
    const exactPage = targetSlug ? await loadMarkdownPageBySlug(targetSlug) : null
    if (exactPage) {
      return materializeManualEntry(item, toWorkCardEntry(exactPage), 'resolved')
    }

    // Migration-only fallback for stale stored hrefs. Canonical source still must be republished.
    const allPages = await loadAllMarkdownPages()
    const migrated = resolveManualRegistryEntry(item, allPages.map(toWorkCardEntry), true)
    if (migrated) {
      return materializeManualEntry(item, migrated, 'resolved')
    }
  } catch (error) {
    console.error('[CMS-118-R1A-R2] featured target resolution failed', {
      href: item.href,
      error,
    })
  }

  return materializeManualEntry(item, undefined, 'missing')
}

async function refreshManualEntries(): Promise<void> {
  const epoch = ++resolutionEpoch
  const items = manualItems.value
  const parentRegistryEntries = props.pages.map(toWorkCardEntry)

  manualEntries.value = items.map((item) => {
    const target = resolveNavigationTarget(item.href)
    const initial = resolveManualRegistryEntry(item, parentRegistryEntries)
    const resolution: FeaturedWorkResolution = target.kind === 'internal'
      ? initial ? 'resolved' : 'loading'
      : 'external'
    return materializeManualEntry(item, initial, resolution)
  })

  const resolved = await Promise.all(items.map((item) => resolveManualItem(item, parentRegistryEntries)))
  if (disposed || epoch !== resolutionEpoch) return
  manualEntries.value = resolved
}

watch(
  () => props.items.join('\u001f'),
  () => {
    void refreshManualEntries()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  disposed = true
  resolutionEpoch += 1
})

const entries = computed(() => {
  if (manualItems.value.length) {
    return manualEntries.value.slice(0, Math.max(1, props.limit))
  }

  const featuredEntries = getFeaturedWorkEntries(props.pages)
  const filtered = props.kind
    ? featuredEntries.filter((entry) => entry.kind === props.kind)
    : featuredEntries

  return filtered
    .map((entry) => ({
      ...entry,
      resolution: 'resolved' as const,
      sourceHref: entry.href,
    }))
    .slice(0, Math.max(1, props.limit))
})

const shouldRenderSection = computed(() => manualItems.value.length > 0 || entries.value.length > 0)
</script>

<template>
  <section
    v-if="shouldRenderSection"
    class="vt-featured-works"
    :data-layout="layout"
  >
    <h2 v-if="title" class="vt-featured-works__title">{{ title }}</h2>

    <div class="vt-featured-works__grid">
      <WorkCard
        v-for="entry in entries"
        :key="entry.slug || entry.href"
        :slug="entry.slug"
        :title="entry.title"
        :description="entry.description"
        :cover="entry.cover"
        :href="entry.href"
        :tag="entry.kind"
        :show-tag="false"
        :content-dir="entry.contentDir"
        :data-featured-resolution="entry.resolution"
        :data-featured-target="entry.sourceHref"
      />
    </div>
  </section>
</template>
