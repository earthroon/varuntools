import { nextTick, onBeforeUnmount, ref, watch, type ComputedRef, type Ref } from 'vue'
import type { MarkdownHeading } from '@/markdown/types'

type HeadingRef = Ref<MarkdownHeading[]> | ComputedRef<MarkdownHeading[]>

function escapeCssIdentifier(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value)
  }

  return value.replace(/[^a-zA-Z0-9_-]/g, (char) => `\\${char}`)
}

export function useActiveHeading(
  root: Ref<HTMLElement | null>,
  headings: HeadingRef,
) {
  const activeHeadingId = ref('')
  let observer: IntersectionObserver | null = null

  function cleanup() {
    observer?.disconnect()
    observer = null
  }

  async function observe() {
    cleanup()
    await nextTick()

    const rootEl = root.value
    if (!rootEl || !headings.value.length) {
      activeHeadingId.value = ''
      return
    }

    const elements = headings.value
      .map((heading) =>
        rootEl.querySelector<HTMLElement>(`#${escapeCssIdentifier(heading.id)}`),
      )
      .filter((el): el is HTMLElement => Boolean(el))

    if (!elements.length) {
      activeHeadingId.value = ''
      return
    }

    activeHeadingId.value = elements[0].id

    observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

        if (visible[0]?.target instanceof HTMLElement) {
          activeHeadingId.value = visible[0].target.id
        }
      },
      {
        root: null,
        rootMargin: '-90px 0px -70% 0px',
        threshold: [0, 1],
      },
    )

    elements.forEach((element) => observer?.observe(element))
  }

  watch(
    () => [root.value, headings.value.map((heading) => heading.id).join('|')],
    () => {
      void observe()
    },
    { immediate: true, flush: 'post' },
  )

  onBeforeUnmount(cleanup)

  return {
    activeHeadingId,
    refreshActiveHeading: observe,
    cleanupActiveHeading: cleanup,
  }
}
