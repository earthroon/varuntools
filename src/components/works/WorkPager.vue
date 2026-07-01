<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import type { WorkCardEntry } from '@/markdown/pageRegistry'

const props = defineProps<{
  previous?: WorkCardEntry | null
  next?: WorkCardEntry | null
}>()

const routerBase = import.meta.env.BASE_URL || '/'

function stripRouterBase(path: string): string {
  const base = routerBase.replace(/\/+$/, '')

  if (!base || base === '/') return path
  if (path === base) return '/'
  if (path.startsWith(`${base}/`)) return path.slice(base.length) || '/'

  return path
}

function normalizeWorkRoute(entry?: WorkCardEntry | null): string {
  const rawHref = String(entry?.href || '').trim()

  if (!rawHref || rawHref === '#') return '/'

  const withoutOrigin = rawHref.replace(/^https?:\/\/[^/]+/i, '')
  const withoutDot = withoutOrigin.replace(/^\.\//, '')
  const rooted = withoutDot.startsWith('/')
    ? withoutDot
    : `/${withoutDot.replace(/^\/+/, '')}`

  return stripRouterBase(rooted)
}

const previousTo = computed(() => normalizeWorkRoute(props.previous))
const nextTo = computed(() => normalizeWorkRoute(props.next))
</script>

<template>
  <nav v-if="previous || next" class="vt-work-pager" data-vt-ui23r1-visible-adjacent-nav="1" aria-label="이전/다음 작업">
    <RouterLink
      v-if="previous"
      class="vt-work-pager__link is-previous"
      data-vt-ui23r1-adjacent-link="previous"
      :to="previousTo"
    >
      <span>이전 작업</span>
      <strong>{{ previous.title }}</strong>
    </RouterLink>

    <RouterLink
      v-if="next"
      class="vt-work-pager__link is-next"
      data-vt-ui23r1-adjacent-link="next"
      :to="nextTo"
    >
      <span>다음 작업</span>
      <strong>{{ next.title }}</strong>
    </RouterLink>
  </nav>
</template>


<style scoped>
/* VT-UI-23 work adjacent navigation context */
.vt-work-pager {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-block-start: 80px;
}

.vt-work-pager__link {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 112px;
  padding: 20px;
  border: 1px solid currentColor;
  border-radius: 18px;
  text-decoration: none;
}

.vt-work-pager__link.is-next {
  text-align: right;
}

.vt-work-pager__link span {
  font-size: 12px;
  opacity: 0.64;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.vt-work-pager__link strong {
  font-size: clamp(1rem, 1.6vw, 1.18rem);
  line-height: 1.3;
}

@media (max-width: 720px) {
  .vt-work-pager {
    grid-template-columns: 1fr;
    margin-block-start: 56px;
  }

  .vt-work-pager__link.is-next {
    text-align: left;
  }
}
</style>
