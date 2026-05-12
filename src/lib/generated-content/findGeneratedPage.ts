import { loadGeneratedPages } from './loadGeneratedPages'
import type { GeneratedPage } from '@/types/generatedContent'

function normalizeSlug(value: string): string {
  return String(value || '').trim().replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/')
}

export function findGeneratedPageBySlug(slug: string): GeneratedPage | null {
  const normalized = normalizeSlug(slug)
  return loadGeneratedPages().find((page) => normalizeSlug(page.slug) === normalized) || null
}

export function findGeneratedPageById(id: string): GeneratedPage | null {
  const normalized = String(id || '').trim()
  return loadGeneratedPages().find((page) => page.id === normalized) || null
}
