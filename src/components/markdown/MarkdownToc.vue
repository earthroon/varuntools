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
const isMobileViewport = ref(false)
const isScrollIdle = ref(true)
const tocPanelId = 'vt-toc-panel'
const hasHeadings = computed(() => props.headings.length > 0)
const parentHref = computed(() => getParentPath(route.path) || props.homeHref)
const toggleLabel = computed(() => (isOpen.value ? '문서 목차 닫기' : '문서 목차 열기'))
const toggleVisualLabel = computed(() => (isMobileViewport.value ? '☰' : '목차'))

const SCROLL_IDLE_DELAY_MS = 420
const MOBILE_QUERY = '(max-width: 980px)'
const DEFAULT_MOBILE_GUTTER_PX = 24

const EMPTY_STYLE: Record<string, string> = {}

type TocDockMetrics = {
  top: number
  right: number
  gutter: number
}

const tocDockMetrics = ref<TocDockMetrics>({
  top: 14,
  right: DEFAULT_MOBILE_GUTTER_PX,
  gutter: DEFAULT_MOBILE_GUTTER_PX,
})

let scrollIdleTimer: number | null = null
let mobileQuery: MediaQueryList | null = null
let cleanupMobileQuery: (() => void) | null = null

function closeMobileToc() {
  isOpen.value = false
}

function clearScrollIdleTimer() {
  if (scrollIdleTimer === null) return
  window.clearTimeout(scrollIdleTimer)
  scrollIdleTimer = null
}

function readViewportWidth() {
  return Math.max(
    1,
    window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth || 1,
  )
}

function readViewportHeight() {
  return Math.max(
    1,
    window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight || 1,
  )
}

function readMobileGutterPx() {
  const raw = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue('--vt-mobile-page-gutter')
    .trim()
  const parsed = Number.parseFloat(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MOBILE_GUTTER_PX
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function readHeaderDockMetrics(): TocDockMetrics {
  const viewportWidth = readViewportWidth()
  const viewportHeight = readViewportHeight()
  const gutter = readMobileGutterPx()
  const header = document.querySelector<HTMLElement>('.vt-site-header')
  const headerRect = header?.getBoundingClientRect()
  const safeTop = 14
  const safeRight = gutter

  if (!headerRect) {
    return {
      top: safeTop,
      right: safeRight,
      gutter,
    }
  }

  const headerVerticalOffset = clampNumber(headerRect.height - 78, 12, 56)
  const top = clampNumber(Math.round(headerRect.top + headerVerticalOffset), safeTop, viewportHeight - 64)
  const right = Math.max(safeRight, Math.round(viewportWidth - headerRect.right + 12))

  return {
    top,
    right,
    gutter,
  }
}

function updateMobileDockMetrics() {
  if (!isMobileViewport.value) return
  tocDockMetrics.value = readHeaderDockMetrics()
}

function syncMobileViewport() {
  isMobileViewport.value = mobileQuery?.matches ?? window.matchMedia(MOBILE_QUERY).matches

  if (!isMobileViewport.value) {
    isScrollIdle.value = true
    clearScrollIdleTimer()
    return
  }

  updateMobileDockMetrics()
}

function handleScroll() {
  if (!isMobileViewport.value) return

  if (isOpen.value) isOpen.value = false

  updateMobileDockMetrics()
  isScrollIdle.value = false
  clearScrollIdleTimer()

  scrollIdleTimer = window.setTimeout(() => {
    updateMobileDockMetrics()
    isScrollIdle.value = true
    scrollIdleTimer = null
  }, SCROLL_IDLE_DELAY_MS)
}

function handleResize() {
  syncMobileViewport()
}

function toggleMobileToc() {
  updateMobileDockMetrics()
  isScrollIdle.value = true
  isOpen.value = !isOpen.value
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

const isScrollHidden = computed(() => isMobileViewport.value && !isScrollIdle.value && !isOpen.value)

const tocRootStyle = computed<Record<string, string>>((): Record<string, string> => {
  if (!isMobileViewport.value) return EMPTY_STYLE

  const metrics = tocDockMetrics.value
  const hidden = isScrollHidden.value

  return {
    position: 'fixed',
    top: `${metrics.top}px`,
    right: `${metrics.right}px`,
    left: 'auto',
    bottom: 'auto',
    width: 'auto',
    zIndex: '42',
    opacity: hidden ? '0' : '1',
    pointerEvents: hidden ? 'none' : 'auto',
    transform: hidden ? 'translateY(-6px) scale(0.98)' : 'none',
    transition: 'opacity 140ms ease, transform 140ms ease',
  }
})

const tocToggleStyle = computed<Record<string, string>>((): Record<string, string> => {
  if (!isMobileViewport.value) return EMPTY_STYLE

  return {
    minWidth: '44px',
    width: '44px',
    height: '40px',
    padding: '0',
    borderRadius: '999px',
  }
})

const tocPanelStyle = computed<Record<string, string>>((): Record<string, string> => {
  if (!isMobileViewport.value) return EMPTY_STYLE

  const gutter = tocDockMetrics.value.gutter

  return {
    position: 'absolute',
    top: 'calc(100% + 0.55rem)',
    right: '0',
    left: 'auto',
    bottom: 'auto',
    width: `min(320px, calc(100vw - ${gutter * 2}px))`,
    maxHeight: 'min(520px, calc(100vh - 7rem))',
  }
})

onMounted(() => {
  mobileQuery = window.matchMedia(MOBILE_QUERY)
  syncMobileViewport()

  const handleMobileQueryChange = () => syncMobileViewport()
  if (typeof mobileQuery.addEventListener === 'function') {
    mobileQuery.addEventListener('change', handleMobileQueryChange)
    cleanupMobileQuery = () => mobileQuery?.removeEventListener('change', handleMobileQueryChange)
  } else {
    mobileQuery.addListener(handleMobileQueryChange)
    cleanupMobileQuery = () => mobileQuery?.removeListener(handleMobileQueryChange)
  }

  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleResize, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleResize)
  cleanupMobileQuery?.()
  cleanupMobileQuery = null
  clearScrollIdleTimer()
})
</script>

<template>
  <nav
    v-if="hasHeadings"
    class="vt-toc"
    :class="{
      'is-open': isOpen,
      'is-scroll-idle': isScrollIdle,
      'is-scroll-hidden': isScrollHidden,
      'is-mobile-docked': isMobileViewport,
    }"
    :style="tocRootStyle"
    :data-vacms-toc-dock="isMobileViewport ? 'vue-owned-header-zone' : 'desktop-rail'"
    :data-vacms-toc-scroll-state="isScrollIdle ? 'idle' : 'scrolling'"
    aria-label="문서 목차"
  >
    <button
      class="vt-toc__toggle"
      type="button"
      :style="tocToggleStyle"
      :aria-expanded="isOpen ? 'true' : 'false'"
      :aria-controls="tocPanelId"
      :aria-label="toggleLabel"
      @click="toggleMobileToc"
    >
      {{ toggleVisualLabel }}
    </button>

    <div :id="tocPanelId" class="vt-toc__panel" :style="tocPanelStyle">
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
