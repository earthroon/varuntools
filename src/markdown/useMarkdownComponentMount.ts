import { nextTick, onBeforeUnmount, watch, type ComputedRef, type Ref } from 'vue'
import type { LoadedMarkdownPage } from './types'
import { mountMarkdownComponents } from './mountMarkdownComponents'

export type UseMarkdownComponentMountOptions = {
  root: Ref<HTMLElement | null>
  page: ComputedRef<LoadedMarkdownPage | null>
  pages: ComputedRef<LoadedMarkdownPage[]>
  onMounted?: () => void | Promise<void>
}

export function useMarkdownComponentMount(
  options: UseMarkdownComponentMountOptions,
): void {
  let cleanupMarkdownComponents: (() => void) | null = null

  watch(
    () => `${options.page.value?.slug || ''}:${options.page.value?.html || ''}`,
    async () => {
      cleanupMarkdownComponents?.()
      cleanupMarkdownComponents = null

      await nextTick()

      if (!options.root.value || !options.page.value) return

      cleanupMarkdownComponents = mountMarkdownComponents(options.root.value, {
        contentDir: options.page.value.contentDir,
        page: options.page.value,
        pages: options.pages.value,
      })

      await options.onMounted?.()
    },
    { immediate: true, flush: 'post' },
  )

  onBeforeUnmount(() => {
    cleanupMarkdownComponents?.()
    cleanupMarkdownComponents = null
  })
}
