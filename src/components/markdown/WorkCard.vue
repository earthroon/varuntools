<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { LoadedMarkdownPage } from '@/markdown/types'
import { toWorkCardEntry } from '@/markdown/pageRegistry'
import { resolveContentAssetMeta } from '@/markdown/resolveContentAssets'
import { warmMarkdownNavigationTarget } from '@/markdown/markdownNavigationPrefetch'

const props = withDefaults(
  defineProps<{
    pages?: LoadedMarkdownPage[]
    contentDir?: string
    slug?: string
    title?: string
    description?: string
    cover?: string
    href?: string
    tag?: string
    role?: string[]
    stack?: string[]
    tags?: string[]
    year?: number
    period?: string
    featured?: boolean
    status?: string
  }>(),
  {
    pages: () => [],
    contentDir: '',
    slug: '',
    title: '',
    description: '',
    cover: '',
    href: '',
    tag: '',
    role: () => [],
    stack: () => [],
    tags: () => [],
    year: undefined,
    period: '',
    featured: false,
    status: '',
  },
)

const router = useRouter()

const registryEntry = computed(() => {
  if (!props.slug) return null
  const page = props.pages.find((item) => item.slug === props.slug)
  return page ? toWorkCardEntry(page) : null
})

function firstItems(items: string[] = [], limit = 4): string[] {
  return items.filter(Boolean).slice(0, limit)
}

const card = computed(() => {
  const entry = registryEntry.value

  return {
    title: props.title || entry?.title || '',
    description: props.description || entry?.summary || entry?.description || '',
    cover: props.cover || entry?.cover || '',
    href: props.href || entry?.href || '',
    tag: props.tag || entry?.type || entry?.kind || '',
    contentDir: props.contentDir || entry?.contentDir || '',
    role: props.role.length ? props.role : entry?.role || [],
    stack: props.stack.length ? props.stack : entry?.stack || [],
    tags: props.tags.length ? props.tags : entry?.tags || [],
    year: props.year || entry?.year,
    period: props.period || entry?.period || '',
    featured: props.featured || entry?.featured || false,
    status: props.status || entry?.workStatus || '',
  }
})

const coverAsset = computed(() => {
  return resolveContentAssetMeta(card.value.contentDir, card.value.cover)
})

const safeHref = computed(() => card.value.href || '#')
const external = computed(() => /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(safeHref.value))
const opensNewTab = computed(() => /^(?:https?:)?\/\//i.test(safeHref.value))
const browserHandled = computed(() => external.value || safeHref.value.startsWith('#'))
const roleChips = computed(() => firstItems(card.value.role, 3))
const stackChips = computed(() => firstItems(card.value.stack, 4))
const tagChips = computed(() => firstItems(card.value.tags, 4))
const metaLine = computed(() => card.value.period || (card.value.year ? String(card.value.year) : ''))

function warmCardTarget() {
  if (browserHandled.value) return
  warmMarkdownNavigationTarget(safeHref.value)
}
function navigateCardTarget(event: MouseEvent): void {
  warmCardTarget()

  if (browserHandled.value) return
  if (event.defaultPrevented) return
  if (event.button !== 0) return
  if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return

  event.preventDefault()
  void router.push(safeHref.value)
}

</script>

<template>
  <a
    class="vt-work-card"
    :href="safeHref"
    :target="opensNewTab ? '_blank' : undefined"
    :rel="opensNewTab ? 'noopener noreferrer' : undefined"
  
    @pointerenter="warmCardTarget"
    @focus="warmCardTarget"
    @click="navigateCardTarget"
    @pointerdown="warmCardTarget"
  >
    <div class="vt-work-card__media">
      <img
        v-if="coverAsset.found"
        class="vt-work-card__image"
        :src="coverAsset.url"
        :alt="card.title"
        loading="lazy"
        decoding="async"
      />

      <div v-else class="vt-work-card__missing">No cover</div>

      <span v-if="card.tag" class="vt-work-card__tag">{{ card.tag }}</span>
      <span v-if="card.featured" class="vt-work-card__featured">Featured</span>
    </div>

    <div class="vt-work-card__body">
      <div class="vt-work-card__meta-row">
        <span v-if="metaLine" class="vt-work-card__meta">{{ metaLine }}</span>
        <span v-if="card.status === 'archived'" class="vt-work-card__status">Archived</span>
      </div>

      <strong class="vt-work-card__title">{{ card.title || 'Untitled' }}</strong>
      <p v-if="card.description" class="vt-work-card__description">
        {{ card.description }}
      </p>

      <div v-if="roleChips.length" class="vt-work-card__chips" aria-label="역할">
        <span v-for="item in roleChips" :key="`role-${item}`" class="vt-work-card__chip vt-work-card__chip--role">
          {{ item }}
        </span>
      </div>

      <div v-if="stackChips.length" class="vt-work-card__chips" aria-label="기술 스택">
        <span v-for="item in stackChips" :key="`stack-${item}`" class="vt-work-card__chip">
          {{ item }}
        </span>
      </div>

      <div v-if="tagChips.length" class="vt-work-card__chips vt-work-card__chips--muted" aria-label="태그">
        <span v-for="item in tagChips" :key="`tag-${item}`" class="vt-work-card__chip vt-work-card__chip--muted">
          #{{ item }}
        </span>
      </div>
    </div>
  </a>
</template>
