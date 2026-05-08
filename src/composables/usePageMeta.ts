import { watch, type ComputedRef } from 'vue'
import type { PageMeta } from '@/metadata/pageMeta'

function setMetaByName(name: string, content: string): void {
  let element = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)

  if (!element) {
    element = document.createElement('meta')
    element.setAttribute('name', name)
    document.head.appendChild(element)
  }

  element.setAttribute('content', content)
}

function setMetaByProperty(property: string, content: string): void {
  let element = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)

  if (!element) {
    element = document.createElement('meta')
    element.setAttribute('property', property)
    document.head.appendChild(element)
  }

  element.setAttribute('content', content)
}

function setLink(rel: string, href: string): void {
  let element = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)

  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', rel)
    document.head.appendChild(element)
  }

  element.setAttribute('href', href)
}

export function applyPageMeta(meta: PageMeta): void {
  document.title = meta.title

  setMetaByName('description', meta.description)
  setMetaByName('robots', meta.robots)

  setMetaByProperty('og:title', meta.ogTitle)
  setMetaByProperty('og:description', meta.ogDescription)
  setMetaByProperty('og:image', meta.ogImage)
  setMetaByProperty('og:type', meta.ogType)
  setMetaByProperty('og:url', meta.canonicalUrl)
  setMetaByProperty('og:site_name', 'VARUNTOOLS')

  setMetaByName('twitter:card', meta.twitterCard)
  setMetaByName('twitter:title', meta.ogTitle)
  setMetaByName('twitter:description', meta.ogDescription)
  setMetaByName('twitter:image', meta.ogImage)

  setLink('canonical', meta.canonicalUrl)
}

export function usePageMeta(meta: ComputedRef<PageMeta | null>): void {
  watch(
    meta,
    (value) => {
      if (!value) return
      applyPageMeta(value)
    },
    { immediate: true },
  )
}
