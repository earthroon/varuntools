<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import type { WorkCardEntry } from '@/markdown/pageRegistry'

const props = defineProps<{
  previous?: WorkCardEntry | null
  next?: WorkCardEntry | null
}>()

const routerBase = import.meta.env.BASE_URL || '/'

function isExternalHref(href: string): boolean {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href)
}

function stripRouterBase(path: string): string {
  const base = routerBase.replace(/\/+$/, '')

  if (!base || base === '/') return path
  if (path === base) return '/'
  if (path.startsWith(`${base}/`)) return path.slice(base.length) || '/'

  return path
}

function normalizeWorkRoute(entry?: WorkCardEntry | null): string {
  const rawHref = (entry?.href || entry?.slug || '').trim()

  if (!rawHref || rawHref === '#') return '/'
  if (isExternalHref(rawHref)) return rawHref

  const withoutDot = rawHref.replace(/^\.\//, '')
  const rooted = withoutDot.startsWith('/')
    ? withoutDot
    : `/${withoutDot.replace(/^\/+/, '')}`

  return stripRouterBase(rooted)
}

const previousTo = computed(() => normalizeWorkRoute(props.previous))
const nextTo = computed(() => normalizeWorkRoute(props.next))
</script>

<template>
  <nav v-if="previous || next" class="vt-work-pager" aria-label="Previous and next works">
    <RouterLink
      v-if="previous"
      class="vt-work-pager__link is-previous"
      :to="previousTo"
    >
      <span>Previous</span>
      <strong>{{ previous.title }}</strong>
    </RouterLink>

    <RouterLink
      v-if="next"
      class="vt-work-pager__link is-next"
      :to="nextTo"
    >
      <span>Next</span>
      <strong>{{ next.title }}</strong>
    </RouterLink>
  </nav>
</template>
