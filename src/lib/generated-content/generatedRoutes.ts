import type { RouteRecordRaw } from 'vue-router'
import GeneratedPageView from '@/pages/GeneratedPageView.vue'
import { loadGeneratedPages } from './loadGeneratedPages'

function normalizeRoutePath(slug: string): string {
  const normalized = String(slug || '').trim().replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/')
  return normalized ? `/${normalized}` : '/'
}

export const generatedRoutes: RouteRecordRaw[] = loadGeneratedPages().map((page) => ({
  path: normalizeRoutePath(page.slug),
  name: `generated:${page.id}`,
  component: GeneratedPageView,
  meta: {
    generatedPageId: page.id,
    generatedSlug: page.slug,
  },
}))
