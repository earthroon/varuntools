import { nextTick, onBeforeUnmount, ref, watch, type Ref } from 'vue'
import type { MarkdownHeading } from '@/markdown/types'

export type ObservedHeading = MarkdownHeading

export type UseObservedHeadingsOptions = {
  selector?: string
  includeH1?: boolean
  minLevel?: number
  maxLevel?: number
}

const DEFAULT_SELECTOR = 'h2, h3, h4'

function escapeHeadingBase(value: string): string {
  const normalized = String(value || '')
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || 'section'
}

function headingLevel(element: Element): number {
  const match = element.tagName.match(/^H([1-6])$/i)
  return match ? Number(match[1]) : 0
}

function isHiddenHeading(element: HTMLElement): boolean {
  if (element.hidden) return true
  if (element.getAttribute('aria-hidden') === 'true') return true
  if (element.getAttribute('data-toc-hidden') === 'true') return true

  const style = window.getComputedStyle(element)
  return style.display === 'none' || style.visibility === 'hidden'
}

function ensureHeadingId(element: HTMLElement, text: string, index: number, usedIds: Set<string>): string {
  const existing = element.id.trim()
  if (existing) {
    usedIds.add(existing)
    return existing
  }

  const base = `section-${escapeHeadingBase(text)}-${index + 1}`
  let candidate = base
  let suffix = 2

  while (usedIds.has(candidate) || document.getElementById(candidate)) {
    candidate = `${base}-${suffix}`
    suffix += 1
  }

  element.id = candidate
  element.setAttribute('data-observed-heading-id', 'true')
  usedIds.add(candidate)
  return candidate
}

export function useObservedHeadings(
  root: Ref<HTMLElement | null>,
  options: UseObservedHeadingsOptions = {},
) {
  const observedHeadings = ref<ObservedHeading[]>([])
  let observer: MutationObserver | null = null
  let frame = 0

  const selector = options.selector || DEFAULT_SELECTOR
  const minLevel = options.includeH1 ? 1 : options.minLevel ?? 2
  const maxLevel = options.maxLevel ?? 4

  function cleanupObservedHeadings() {
    observer?.disconnect()
    observer = null
    if (frame) {
      cancelAnimationFrame(frame)
      frame = 0
    }
  }

  async function refreshObservedHeadings() {
    await nextTick()

    const rootEl = root.value
    if (!rootEl) {
      observedHeadings.value = []
      return
    }

    const usedIds = new Set<string>()
    const headings = Array.from(rootEl.querySelectorAll<HTMLElement>(selector))
      .map((element, index) => {
        const level = headingLevel(element)
        const text = element.textContent?.trim() || ''
        if (!text) return null
        if (level < minLevel || level > maxLevel) return null
        if (isHiddenHeading(element)) return null

        return {
          id: ensureHeadingId(element, text, index, usedIds),
          text,
          level,
        }
      })
      .filter((heading): heading is ObservedHeading => Boolean(heading))

    observedHeadings.value = headings
  }

  function scheduleRefresh() {
    if (frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      void refreshObservedHeadings()
    })
  }

  function mountObserver() {
    cleanupObservedHeadings()
    const rootEl = root.value
    if (!rootEl) {
      observedHeadings.value = []
      return
    }

    observer = new MutationObserver(scheduleRefresh)
    observer.observe(rootEl, {
      childList: true,
      subtree: true,
      characterData: true,
    })
    void refreshObservedHeadings()
  }

  watch(
    () => root.value,
    () => {
      mountObserver()
    },
    { immediate: true, flush: 'post' },
  )

  onBeforeUnmount(cleanupObservedHeadings)

  return {
    observedHeadings,
    refreshObservedHeadings,
    cleanupObservedHeadings,
  }
}
