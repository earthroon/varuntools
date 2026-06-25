<script setup lang="ts">
import { computed } from 'vue'
import { useRouteManifest } from '@/composables/useRouteManifest'
import {
  usePublicContentCollection,
  type PublicContentCardEntry,
} from '@/composables/usePublicContentCollection'
import {
  useRuntimePublicContentIndex,
  type RuntimePublicContentIndexEntry,
} from '@/composables/useRuntimePublicContentIndex'
import { getPublicContentCategoryLabel } from '@/content/publicContentCategoryLabels'

type SourceFrontmatter = Record<string, unknown>
type HomeRecentEntry = PublicContentCardEntry | RuntimePublicContentIndexEntry

const props = withDefaults(
  defineProps<{
    limit?: number
    title?: string
    description?: string
    includeCategories?: string[]
    showViewAll?: boolean
  }>(),
  {
    limit: 6,
    title: '최근 글과 작업',
    description: '새로 공개된 글, 작업, 실험을 한 번에 봅니다.',
    includeCategories: () => ['post', 'work', 'case-study', 'lab', 'tool', 'doc'],
    showViewAll: true,
  },
)

const { pages } = useRouteManifest()
const { allEntries } = usePublicContentCollection(pages, { scope: 'index' })
const { runtimeEntries, runtimeStatus } = useRuntimePublicContentIndex()

const sourceByEntryKey = computed(() => {
  const out = new Map<string, SourceFrontmatter>()
  for (const page of pages) {
    const fm = page.frontmatter as SourceFrontmatter
    out.set(page.slug, fm)
    out.set(page.contentDir, fm)
  }
  return out
})

function readComparableTime(entry: HomeRecentEntry): number {
  const runtimeTime = Number((entry as RuntimePublicContentIndexEntry).time)
  if (Number.isFinite(runtimeTime) && runtimeTime > 0) return runtimeTime

  const frontmatter = sourceByEntryKey.value.get(entry.slug) || sourceByEntryKey.value.get(entry.contentDir)
  const candidates = [
    frontmatter?.publishedDate,
    frontmatter?.date,
    frontmatter?.updated,
    frontmatter?.created,
    entry.year ? `${entry.year}-01-01` : '',
    entry.slug,
  ]

  for (const value of candidates) {
    const text = String(value || '').trim()
    if (!text) continue
    const direct = Date.parse(text)
    if (Number.isFinite(direct)) return direct
    const year = text.match(/(?:19|20)\d{2}/)?.[0]
    if (year) {
      const fallback = Date.parse(`${year}-01-01`)
      if (Number.isFinite(fallback)) return fallback
    }
  }

  return 0
}

function compareRecent(a: HomeRecentEntry, b: HomeRecentEntry): number {
  return (
    readComparableTime(b) - readComparableTime(a) ||
    Number(b.featured) - Number(a.featured) ||
    a.order - b.order ||
    a.title.localeCompare(b.title)
  )
}

const sourceEntries = computed<HomeRecentEntry[]>(() => {
  if (runtimeStatus.value === 'ready' && runtimeEntries.value.length) {
    return runtimeEntries.value
  }
  return allEntries.value as HomeRecentEntry[]
})

const recentEntries = computed(() => {
  const allowed = new Set(props.includeCategories.map((category) => category.trim()).filter(Boolean))
  return [...sourceEntries.value]
    .filter((entry) => allowed.has(entry.category))
    .sort(compareRecent)
    .slice(0, props.limit)
})

function categoryLabel(entry: HomeRecentEntry): string {
  const runtimeLabel = (entry as RuntimePublicContentIndexEntry).categoryLabel
  return runtimeLabel || getPublicContentCategoryLabel(entry.category)
}
</script>

<template>
  <section
    v-if="recentEntries.length"
    class="vt-home-recent-public-content"
    data-vacms-home-recent-feed="true"
    :data-vacms-home-recent-source="runtimeStatus === 'ready' ? 'runtime-public-index' : 'bundled-route-manifest'"
    aria-labelledby="home-recent-public-content-title"
  >
    <div class="vt-home-recent-public-content__header">
      <p class="vt-home-recent-public-content__eyebrow">최근 공개</p>
      <div class="vt-home-recent-public-content__heading-row">
        <div>
          <h2 id="home-recent-public-content-title">{{ title }}</h2>
          <p v-if="description" class="vt-home-recent-public-content__description">
            {{ description }}
          </p>
        </div>

        <a
          v-if="showViewAll"
          class="vt-home-recent-public-content__link"
          href="/index"
        >
          전체 인덱스 보기
        </a>
      </div>
    </div>

    <div class="vt-home-recent-public-content__grid">
      <article
        v-for="entry in recentEntries"
        :key="entry.slug"
        class="vt-home-recent-public-content__card"
        data-vacms-home-recent-card="true"
        :data-vacms-home-recent-slug="entry.slug"
        :data-vacms-home-recent-category="entry.category"
      >
        <p class="vt-home-recent-public-content__category">
          {{ categoryLabel(entry) }}
        </p>

        <h3 class="vt-home-recent-public-content__title">
          <a :href="entry.href">{{ entry.title }}</a>
        </h3>

        <p v-if="entry.description" class="vt-home-recent-public-content__summary">
          {{ entry.description }}
        </p>

        <ul v-if="entry.tags.length" class="vt-home-recent-public-content__tags" aria-label="태그">
          <li v-for="tag in entry.tags.slice(0, 3)" :key="tag">
            {{ tag }}
          </li>
        </ul>
      </article>
    </div>
  </section>
</template>

<style scoped>
.vt-home-recent-public-content {
  margin: clamp(2rem, 5vw, 4rem) auto;
  width: min(1120px, calc(100% - 2rem));
}

.vt-home-recent-public-content__header {
  margin-bottom: 1.25rem;
}

.vt-home-recent-public-content__eyebrow,
.vt-home-recent-public-content__category {
  color: var(--vt-color-muted, #66756f);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.vt-home-recent-public-content__heading-row {
  align-items: end;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
}

.vt-home-recent-public-content__description {
  color: var(--vt-color-muted, #66756f);
  margin: 0.35rem 0 0;
}

.vt-home-recent-public-content__link {
  font-weight: 700;
  white-space: nowrap;
}

.vt-home-recent-public-content__grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.vt-home-recent-public-content__card {
  background: var(--vt-surface-raised, rgba(255, 255, 255, 0.72));
  border: 1px solid var(--vt-border-subtle, rgba(26, 58, 50, 0.16));
  border-radius: 1.2rem;
  box-shadow: var(--vt-shadow-soft, 0 18px 42px rgba(20, 41, 36, 0.08));
  padding: 1rem;
}

.vt-home-recent-public-content__title {
  font-size: 1.05rem;
  line-height: 1.35;
  margin: 0.35rem 0 0.45rem;
}

.vt-home-recent-public-content__title a {
  color: inherit;
  text-decoration: none;
}

.vt-home-recent-public-content__title a:focus-visible,
.vt-home-recent-public-content__title a:hover {
  text-decoration: underline;
}

.vt-home-recent-public-content__summary {
  color: var(--vt-color-muted, #66756f);
  font-size: 0.92rem;
  margin: 0;
}

.vt-home-recent-public-content__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  list-style: none;
  margin: 0.75rem 0 0;
  padding: 0;
}

.vt-home-recent-public-content__tags li {
  background: var(--vt-surface-muted, rgba(26, 58, 50, 0.08));
  border-radius: 999px;
  color: var(--vt-color-muted, #66756f);
  font-size: 0.76rem;
  padding: 0.2rem 0.5rem;
}
</style>
