<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  canUseBrowserBack,
  getParentPath,
} from '@/navigation/documentNavigation'
import type { MarkdownHeading } from '@/markdown/types'

const props = withDefaults(
  defineProps<{
    headings: MarkdownHeading[]
    activeHeadingId?: string
    title?: string
    showUtilityControls?: boolean
    homeHref?: string
    fallbackBackHref?: string
  }>(),
  {
    title: 'On this page',
    showUtilityControls: true,
    homeHref: '/',
    fallbackBackHref: '/',
  },
)

const router = useRouter()
const route = useRoute()
const isOpen = ref(false)
const tocPanelId = 'vt-toc-panel'
const hasHeadings = computed(() => props.headings.length > 0)
const parentHref = computed(() => getParentPath(route.path) || props.homeHref)
const toggleLabel = computed(() => (isOpen.value ? '문서 목차 닫기' : '문서 목차 열기'))

function closeMobileToc() {
  isOpen.value = false
}

function goBack() {
  closeMobileToc()

  if (canUseBrowserBack()) {
    router.back()
    return
  }

  router.push(props.fallbackBackHref)
}

function goUp() {
  closeMobileToc()
  router.push(parentHref.value)
}

function scrollToHeading(id: string) {
  const element = document.getElementById(id)
  if (!element) return

  const y = window.scrollY + element.getBoundingClientRect().top - 84

  window.scrollTo({
    top: y,
    behavior: 'smooth',
  })

  history.replaceState(null, '', `#${id}`)
  closeMobileToc()
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isOpen.value) {
    isOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <nav
    v-if="hasHeadings"
    class="vt-toc"
    :class="{ 'is-open': isOpen }"
    aria-label="문서 목차"
  >
    <button
      class="vt-toc__toggle"
      type="button"
      :aria-expanded="isOpen ? 'true' : 'false'"
      :aria-controls="tocPanelId"
      :aria-label="toggleLabel"
      @click="isOpen = !isOpen"
    >
      목차
    </button>

    <div :id="tocPanelId" class="vt-toc__panel">
      <div
        v-if="showUtilityControls"
        class="vt-toc__controls"
        aria-label="문서 이동"
      >
        <button
          class="vt-toc__control"
          type="button"
          aria-label="이전 페이지로 이동"
          title="뒤로"
          @click="goBack"
        >
          ◂
        </button>

        <button
          class="vt-toc__control"
          type="button"
          aria-label="상위 경로로 이동"
          title="상위"
          @click="goUp"
        >
          ▴
        </button>

        <RouterLink
          class="vt-toc__control"
          :to="homeHref"
          aria-label="홈으로 이동"
          title="홈"
          @click="closeMobileToc"
        >
          ⌂
        </RouterLink>
      </div>

      <div class="vt-toc__title">{{ title }}</div>

      <button
        v-for="heading in headings"
        :key="heading.id"
        class="vt-toc__link"
        :class="[
          `is-level-${heading.level}`,
          { 'is-active': heading.id === activeHeadingId },
        ]"
        type="button"
        @click="scrollToHeading(heading.id)"
      >
        {{ heading.text }}
      </button>
    </div>
  </nav>
</template>
