import type { GeneratedAssetRef, GeneratedPage } from '@/types/generatedContent'
import { resolveContentAssetMeta } from '@/markdown/resolveContentAssets'

export function getGeneratedPageContentDir(page: GeneratedPage): string {
  return page.contentDir || page.slug || `${page.folder || page.type}s/${page.id}`
}

export function resolveGeneratedAssetSrc(page: GeneratedPage, src: string | undefined): string {
  const source = String(src || '').trim()
  if (!source) return ''

  const resolved = resolveContentAssetMeta(getGeneratedPageContentDir(page), source)
  return resolved.url || source
}

export function resolveGeneratedAsset(page: GeneratedPage, asset: GeneratedAssetRef | undefined): GeneratedAssetRef | null {
  if (!asset) return null
  return {
    ...asset,
    src: resolveGeneratedAssetSrc(page, asset.src),
  }
}
