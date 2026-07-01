import { createApp, type App, type Component } from 'vue'
import VideoPlayer from '@/components/markdown/VideoPlayer.vue'
import BeforeAfterWiper from '@/components/markdown/BeforeAfterWiper.vue'
import ImageCard from '@/components/markdown/ImageCard.vue'
import CaptionedImage from '@/components/markdown/CaptionedImage.vue'
import CalloutBox from '@/components/markdown/CalloutBox.vue'
import SectionGap from '@/components/markdown/SectionGap.vue'
import SectionBreak from '@/components/markdown/SectionBreak.vue'
import FeaturedWorksGrid from '@/components/markdown/FeaturedWorksGrid.vue'
import WorkCard from '@/components/markdown/WorkCard.vue'
import PagecardGrid from '@/components/markdown/PagecardGrid.vue'
import MarkdownBox from '@/components/markdown/MarkdownBox.vue'
import GalleryStrip from '@/components/markdown/GalleryStrip.vue'
import ImageSequence from '@/components/markdown/ImageSequence.vue'
import HomeSection from '@/components/markdown/HomeSection.vue'
import ProductDetailCta from '@/components/markdown/ProductDetailCta.vue'
import ProductTrustBlocks from '@/components/markdown/ProductTrustBlocks.vue'
import ProductSpecBlocks from '@/components/markdown/ProductSpecBlocks.vue'
import ProductCatalog from '@/components/markdown/ProductCatalog.vue'
import ProductVariantSelector from '@/components/markdown/ProductVariantSelector.vue'
import StoreNavigationRail from '@/components/markdown/StoreNavigationRail.vue'
import InquiryForm from '@/components/InquiryForm.vue'
import ClaimPortal from '@/components/ClaimPortal.vue'
import PortfolioHero from '@/components/portfolio/PortfolioHero.vue'
import WorkSummary from '@/components/portfolio/WorkSummary.vue'
import RoleStack from '@/components/portfolio/RoleStack.vue'
import CaseSection from '@/components/portfolio/CaseSection.vue'
import MetricCard from '@/components/portfolio/MetricCard.vue'
import ToolStack from '@/components/portfolio/ToolStack.vue'
import QuoteBlock from '@/components/portfolio/QuoteBlock.vue'
import EditorialTitle from '@/components/portfolio/EditorialTitle.vue'
import EditorialColumns from '@/components/portfolio/EditorialColumns.vue'
import CaseGallery from '@/components/portfolio/CaseGallery.vue'
import CaseGalleryItem from '@/components/portfolio/CaseGalleryItem.vue'
import PortfolioRelatedWorks from '@/components/portfolio/PortfolioRelatedWorks.vue'
import DemoFrame from '@/components/demo/DemoFrame.vue'
import { resolveContentAssetMeta } from './resolveContentAssets'
import { resolveMediaAsset } from '@/content/assetRegistry'
import { parseGalleryStripItems } from './galleryStripItems'
import { parseImageSequenceTemplateItems } from './imageSequenceItems'
import type { LoadedMarkdownPage } from './types'

export type MarkdownMountOptions = {
  contentDir: string
  page?: LoadedMarkdownPage
  pages: LoadedMarkdownPage[]
}

type MountedApp = {
  element: Element
  app: App
}

function strictTrueAttr(value: string | undefined): boolean {
  return value === 'true'
}

function boolAttr(value: string | undefined, fallback = false): boolean {
  if (value === undefined) return fallback
  return value === 'true'
}

function numberAttr(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}


function boolishAttr(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value
  const text = String(value ?? '').trim().toLowerCase()
  if (text === 'true') return true
  if (text === 'false') return false
  return undefined
}

function galleryMediaFromMeta(meta: Record<string, unknown> = {}) {
  const read = (key: string) => meta[key] ?? key.split('.').reduce((cursor: any, part) => (cursor && typeof cursor === 'object' ? cursor[part] : undefined), meta as any)
  const media = {
    ewaPreset: String(read('media.ewaPreset') ?? read('ewaPreset') ?? '').trim() || undefined,
    ewaMode: String(read('media.ewaMode') ?? read('ewaMode') ?? '').trim() || undefined,
    pixelSafe: boolishAttr(read('media.pixelSafe') ?? read('pixelSafe')),
    ewaEnabled: boolishAttr(read('media.ewaEnabled') ?? read('ewaEnabled')),
    ewaNote: String(read('media.ewaNote') ?? read('ewaNote') ?? '').trim() || undefined,
  }
  return Object.values(media).some((value) => value !== undefined && value !== '') ? media : undefined
}

function stringAttr(value: string | undefined, fallback = ''): string {
  return value === undefined ? fallback : value
}

function parseJsonAttr<T>(value: string | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function normalizeColumns(value: string | undefined): 'auto' | 'compact' | 'wide' {
  return value === 'compact' || value === 'wide' ? value : 'auto'
}

function normalizeSort(value: string | undefined): 'manual' | 'title' | 'order' | 'date' {
  return value === 'title' || value === 'order' || value === 'date' ? value : 'manual'
}


function normalizeVideoPreload(value: string | undefined): 'none' | 'metadata' | 'auto' {
  return value === 'none' || value === 'auto' ? value : 'metadata'
}

function normalizeVideoRatio(value: string | undefined): 'auto' | '16/9' | '4/3' | '1/1' | '9/16' {
  return value === '16/9' || value === '4/3' || value === '1/1' || value === '9/16'
    ? value
    : 'auto'
}

function normalizeVideoFit(value: string | undefined): 'contain' | 'cover' {
  return value === 'cover' ? 'cover' : 'contain'
}


function parseListAttr(value: string | undefined): string[] {
  if (!value) return []
  const parsed = parseJsonAttr(value, null as string[] | null)
  if (Array.isArray(parsed)) return parsed.map((item) => String(item ?? '').trim()).filter(Boolean)
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

function templateHtml(element: HTMLElement, selector: string): string {
  const template = element.querySelector(selector) as HTMLTemplateElement | null
  return template?.innerHTML || ''
}

function resolvePortfolioImage(contentDir: string, source: string | undefined) {
  return resolveContentAssetMeta(contentDir, source || '')
}

function normalizeGalleryLayout(value: string | undefined): 'strip' | 'grid' | 'compact' {
  return value === 'grid' || value === 'compact' ? value : 'strip'
}



function normalizeEditorialHeadingLevel(value: string | undefined): 'major' | 'middle' | 'minor' {
  return value === 'major' || value === 'minor' ? value : 'middle'
}

function normalizeEditorialHeadingTag(value: string | undefined): 'h1' | 'h2' | 'h3' | 'h4' | undefined {
  return value === 'h1' || value === 'h2' || value === 'h3' || value === 'h4' ? value : undefined
}

function normalizeEditorialHeadingAlign(value: string | undefined): 'left' | 'center' {
  return value === 'center' ? 'center' : 'left'
}

function normalizeEditorialColumns(value: string | undefined): 2 | 3 {
  return value === '3' ? 3 : 2
}

function normalizeEditorialColumnGap(value: string | undefined): 'sm' | 'md' | 'lg' {
  return value === 'sm' || value === 'lg' ? value : 'md'
}

function normalizeEditorialColumnCollapse(value: string | undefined): 'mobile' | 'tablet' | 'never' {
  return value === 'tablet' || value === 'never' ? value : 'mobile'
}

function templateHtmlList(element: HTMLElement, selector: string): string[] {
  return Array.from(element.querySelectorAll(selector)).map((template) => (template as HTMLTemplateElement).innerHTML || '')
}

function mountOne(
  element: Element,
  component: Component,
  props: Record<string, unknown>,
): MountedApp | null {
  const htmlElement = element as HTMLElement
  if (htmlElement.dataset.vtMounted === '1') return null

  const app = createApp(component, props)
  app.mount(element)
  htmlElement.dataset.vtMounted = '1'

  return { element, app }
}

export function mountMarkdownComponents(
  root: HTMLElement,
  options: MarkdownMountOptions,
): () => void {
  const mounted: MountedApp[] = []

  root.querySelectorAll('image-sequence').forEach((element) => {
    const el = element as HTMLElement
    const itemsTemplate = el.querySelector('template[data-image-sequence-items]') as HTMLTemplateElement | null
    const rawItems = parseImageSequenceTemplateItems(itemsTemplate?.textContent || '')

    const items = rawItems.map((item) => {
      const srcAsset = resolveContentAssetMeta(options.contentDir, item.src)

      return {
        assetId: item.assetId,
        src: srcAsset.url,
        srcFound: srcAsset.found,
        srcReason: srcAsset.reason || '',
        source: item.src || '',
        alt: item.alt || '',
        caption: item.caption,
        width: item.width,
        height: item.height,
        filename: item.filename,
        mimeType: item.mimeType,
      }
    })

    const props = {
      layout: el.dataset.layout === 'crop-strip' ? 'crop-strip' : 'crop-strip',
      reserved: boolAttr(el.dataset.reserved, true),
      lazy: boolAttr(el.dataset.lazy, true),
      fade: boolAttr(el.dataset.fade, true),
      width: numberAttr(el.dataset.width, 0) || undefined,
      height: numberAttr(el.dataset.height, 0) || undefined,
      items,
    }

    const mountedApp = mountOne(element, ImageSequence, props)
    if (mountedApp) mounted.push(mountedApp)
  })


  root.querySelectorAll('editorial-title').forEach((element) => {
    const el = element as HTMLElement
    const props = {
      level: normalizeEditorialHeadingLevel(el.dataset.level),
      as: normalizeEditorialHeadingTag(el.dataset.as),
      title: stringAttr(el.dataset.title, ''),
      kicker: stringAttr(el.dataset.kicker, ''),
      subtitle: stringAttr(el.dataset.subtitle, ''),
      align: normalizeEditorialHeadingAlign(el.dataset.align),
    }
    const mountedApp = mountOne(element, EditorialTitle, props)
    if (mountedApp) mounted.push(mountedApp)
  })

  root.querySelectorAll('editorial-columns').forEach((element) => {
    const el = element as HTMLElement
    const props = {
      cols: normalizeEditorialColumns(el.dataset.cols || el.dataset.columns),
      gap: normalizeEditorialColumnGap(el.dataset.gap),
      collapse: normalizeEditorialColumnCollapse(el.dataset.collapse),
      balance: boolAttr(el.dataset.balance, false),
      columns: templateHtmlList(el, 'template[data-editorial-column-html]'),
    }
    const mountedApp = mountOne(element, EditorialColumns, props)
    if (mountedApp) mounted.push(mountedApp)
  })


  root.querySelectorAll('portfolio-hero').forEach((element) => {
    const el = element as HTMLElement
    const image = resolvePortfolioImage(options.contentDir, el.dataset.src)
    const props = {
      title: stringAttr(el.dataset.title, ''),
      html: templateHtml(el, 'template[data-portfolio-html]'),
      src: image.url,
      srcFound: image.found,
      srcReason: image.reason || '',
      alt: stringAttr(el.dataset.alt, ''),
      thumb: stringAttr(el.dataset.thumb, ''),
      layout: stringAttr(el.dataset.layout, 'split'),
      role: parseListAttr(el.dataset.roleJson || el.dataset.role),
      stack: parseListAttr(el.dataset.stackJson || el.dataset.stack),
      year: stringAttr(el.dataset.year, ''),
      period: stringAttr(el.dataset.period, ''),
      client: stringAttr(el.dataset.client, ''),
      featured: boolAttr(el.dataset.featured, false),
      tags: parseListAttr(el.dataset.tagsJson || el.dataset.tags),
    }
    const mountedApp = mountOne(element, PortfolioHero, props)
    if (mountedApp) mounted.push(mountedApp)
  })

  root.querySelectorAll('work-summary').forEach((element) => {
    const el = element as HTMLElement
    const props = {
      title: stringAttr(el.dataset.title, '작업 개요'),
      html: templateHtml(el, 'template[data-portfolio-html]'),
      problem: stringAttr(el.dataset.problem, ''),
      solution: stringAttr(el.dataset.solution, ''),
      impact: stringAttr(el.dataset.impact, ''),
      summary: stringAttr(el.dataset.summary, ''),
      role: parseListAttr(el.dataset.roleJson || el.dataset.role),
      stack: parseListAttr(el.dataset.stackJson || el.dataset.stack),
      period: stringAttr(el.dataset.period, ''),
      client: stringAttr(el.dataset.client, ''),
      scope: parseListAttr(el.dataset.scopeJson || el.dataset.scope),
      status: stringAttr(el.dataset.status, ''),
    }
    const mountedApp = mountOne(element, WorkSummary, props)
    if (mountedApp) mounted.push(mountedApp)
  })

  root.querySelectorAll('role-stack').forEach((element) => {
    const el = element as HTMLElement
    const props = {
      title: stringAttr(el.dataset.title, '역할과 스택'),
      html: templateHtml(el, 'template[data-portfolio-html]'),
      role: parseListAttr(el.dataset.roleJson || el.dataset.role),
      responsibility: parseListAttr(el.dataset.responsibilityJson || el.dataset.responsibility),
      stack: parseListAttr(el.dataset.stackJson || el.dataset.stack),
      tools: parseListAttr(el.dataset.toolsJson || el.dataset.tools),
    }
    const mountedApp = mountOne(element, RoleStack, props)
    if (mountedApp) mounted.push(mountedApp)
  })

  root.querySelectorAll('case-section').forEach((element) => {
    const el = element as HTMLElement
    const props = {
      type: stringAttr(el.dataset.type, 'process'),
      title: stringAttr(el.dataset.title, ''),
      kind: stringAttr(el.dataset.kind, ''),
      axis: stringAttr(el.dataset.axis, ''),
      weight: stringAttr(el.dataset.weight, ''),
      risk: stringAttr(el.dataset.risk, ''),
      ssot: stringAttr(el.dataset.ssot, ''),
      tradeoff: stringAttr(el.dataset.tradeoff, ''),
      impact: stringAttr(el.dataset.impact, ''),
      html: templateHtml(el, 'template[data-portfolio-html]'),
    }
    const mountedApp = mountOne(element, CaseSection, props)
    if (mountedApp) mounted.push(mountedApp)
  })

  root.querySelectorAll('metric-card').forEach((element) => {
    const el = element as HTMLElement
    const props = {
      title: stringAttr(el.dataset.title, 'Metric'),
      value: stringAttr(el.dataset.value, ''),
      unit: stringAttr(el.dataset.unit, ''),
      label: stringAttr(el.dataset.label, ''),
      delta: stringAttr(el.dataset.delta, ''),
      tone: stringAttr(el.dataset.tone, 'default'),
      html: templateHtml(el, 'template[data-portfolio-html]'),
    }
    const mountedApp = mountOne(element, MetricCard, props)
    if (mountedApp) mounted.push(mountedApp)
  })

  root.querySelectorAll('tool-stack').forEach((element) => {
    const el = element as HTMLElement
    const props = {
      title: stringAttr(el.dataset.title, 'Tool Stack'),
      html: templateHtml(el, 'template[data-portfolio-html]'),
      stack: parseListAttr(el.dataset.stackJson || el.dataset.stack),
      tools: parseListAttr(el.dataset.toolsJson || el.dataset.tools),
      language: parseListAttr(el.dataset.languageJson || el.dataset.language),
      runtime: parseListAttr(el.dataset.runtimeJson || el.dataset.runtime),
      storage: parseListAttr(el.dataset.storageJson || el.dataset.storage),
    }
    const mountedApp = mountOne(element, ToolStack, props)
    if (mountedApp) mounted.push(mountedApp)
  })

  root.querySelectorAll('quote-block').forEach((element) => {
    const el = element as HTMLElement
    const props = {
      by: stringAttr(el.dataset.by, ''),
      tone: stringAttr(el.dataset.tone, 'quiet'),
      size: stringAttr(el.dataset.size, 'normal'),
      html: templateHtml(el, 'template[data-portfolio-html]'),
    }
    const mountedApp = mountOne(element, QuoteBlock, props)
    if (mountedApp) mounted.push(mountedApp)
  })

  root.querySelectorAll('case-gallery').forEach((element, galleryIndex) => {
    const el = element as HTMLElement
    const parsedItems = parseGalleryStripItems(templateHtml(el, 'template[data-case-gallery-items]'))
    const items = parsedItems.map((item) => {
      const srcAsset = resolveContentAssetMeta(options.contentDir, item.src)
      const thumbAsset = item.thumb ? resolveContentAssetMeta(options.contentDir, item.thumb) : null
      return {
        src: srcAsset.url,
        thumbSrc: thumbAsset?.found ? thumbAsset.url : '',
        alt: item.meta?.alt || item.caption || item.title || '',
        caption: item.caption,
        label: item.meta?.label || item.title || '',
        meta: item.meta || {},
        media: galleryMediaFromMeta(item.meta || {}),
        source: item.src,
        thumbSource: item.thumb,
        srcFound: srcAsset.found,
        thumbFound: thumbAsset?.found,
        srcReason: srcAsset.reason || '',
        thumbReason: thumbAsset?.reason || '',
      }
    })
    const props = {
      title: stringAttr(el.dataset.title, ''),
      caption: stringAttr(el.dataset.caption, ''),
      columns: numberAttr(el.dataset.columns, 2),
      variant: stringAttr(el.dataset.variant, 'framed'),
      captionStyle: stringAttr(el.dataset.captionStyle || el.dataset.captionstyle, 'below'),
      groupId: `case-gallery-${galleryIndex + 1}`,
      items,
    }
    const mountedApp = mountOne(element, CaseGallery, props)
    if (mountedApp) mounted.push(mountedApp)
  })

  root.querySelectorAll('case-gallery-item').forEach((element) => {
    const el = element as HTMLElement
    const srcAsset = resolveContentAssetMeta(options.contentDir, el.dataset.src)
    const props = {
      src: srcAsset.url,
      srcFound: srcAsset.found,
      srcReason: srcAsset.reason || '',
      alt: stringAttr(el.dataset.alt, ''),
      caption: stringAttr(el.dataset.caption, ''),
      label: stringAttr(el.dataset.label, ''),
    }
    const mountedApp = mountOne(element, CaseGalleryItem, props)
    if (mountedApp) mounted.push(mountedApp)
  })

  root.querySelectorAll('related-works').forEach((element) => {
    const el = element as HTMLElement
    const props = {
      pages: options.pages,
      currentSlug: options.page?.slug || '',
      title: stringAttr(el.dataset.title, 'Related Works'),
      items: parseListAttr(el.dataset.itemsJson || el.dataset.items),
      layout: stringAttr(el.dataset.layout, 'grid'),
      showStatus: boolAttr(el.dataset.showStatus || el.dataset.showstatus, false),
      limit: numberAttr(el.dataset.limit, 0),
      html: templateHtml(el, 'template[data-related-works-body]'),
    }
    const mountedApp = mountOne(element, PortfolioRelatedWorks, props)
    if (mountedApp) mounted.push(mountedApp)
  })

  root.querySelectorAll('video-player, varun-video').forEach((element) => {
    const el = element as HTMLElement
    const rawSrc = el.dataset.src || el.dataset.fallback || ''
    const rawStream = el.dataset.stream || ''
    const videoAsset = resolveMediaAsset({
      source: rawStream || rawSrc,
      contentDir: options.contentDir,
      expectedType: rawStream ? 'stream' : 'video',
    })
    const posterAsset = resolveMediaAsset({
      source: el.dataset.poster || '',
      contentDir: options.contentDir,
      expectedType: 'image',
    })

    const props = {
      src: videoAsset.mediaType === 'video' ? videoAsset.url : '',
      stream: videoAsset.mediaType === 'stream' ? videoAsset.url : '',
      poster: posterAsset.found ? posterAsset.url : '',
      srcFound: videoAsset.found && videoAsset.mediaType === 'video',
      posterFound: posterAsset.found,
      srcReason: videoAsset.reason || videoAsset.mediaWarning || '',
      posterReason: posterAsset.reason || posterAsset.mediaWarning || '',
      source: rawStream || rawSrc,
      posterSource: el.dataset.poster || '',
      title: el.dataset.title || '',
      caption: el.dataset.caption || '',
      autoplay: boolAttr(el.dataset.autoplay, false),
      loop: boolAttr(el.dataset.loop, false),
      muted: boolAttr(el.dataset.muted, false),
      playsInline: boolAttr(el.dataset.playsInline || el.dataset.playsinline, true),
      controls: strictTrueAttr(el.dataset.controls),
      preload: normalizeVideoPreload(el.dataset.preload),
      tracks: parseJsonAttr(el.dataset.tracks, []),
      ratio: normalizeVideoRatio(el.dataset.ratio),
      fit: normalizeVideoFit(el.dataset.fit),
      breakout: boolAttr(el.dataset.breakout, false),
      manifestWidth: numberAttr(el.dataset.width, 0) || undefined,
      manifestHeight: numberAttr(el.dataset.height, 0) || undefined,
      duration: numberAttr(el.dataset.duration, 0) || undefined,
    }

    const mountedApp = mountOne(element, VideoPlayer, props)
    if (mountedApp) mounted.push(mountedApp)
  })

  root.querySelectorAll('before-after-wiper').forEach((element) => {
    const el = element as HTMLElement
    const beforeAsset = resolveContentAssetMeta(options.contentDir, el.dataset.before)
    const afterAsset = resolveContentAssetMeta(options.contentDir, el.dataset.after)

    const props = {
      before: beforeAsset.url,
      after: afterAsset.url,
      beforeFound: beforeAsset.found,
      afterFound: afterAsset.found,
      beforeReason: beforeAsset.reason || '',
      afterReason: afterAsset.reason || '',
      caption: el.dataset.caption || '',
      initial: numberAttr(el.dataset.initial, 50),
    }

    const mountedApp = mountOne(element, BeforeAfterWiper, props)
    if (mountedApp) mounted.push(mountedApp)
  })


  root.querySelectorAll('captioned-image').forEach((element) => {
    const el = element as HTMLElement
    const srcAsset = resolveContentAssetMeta(options.contentDir, el.dataset.src)

    const props = {
      src: srcAsset.url,
      srcFound: srcAsset.found,
      srcReason: srcAsset.reason || '',
      source: el.dataset.src || '',
      alt: el.dataset.alt || '',
      caption: el.dataset.caption || '',
      tag: el.dataset.tag || '',
      lightbox: boolAttr(el.dataset.lightbox, true),
    }

    const mountedApp = mountOne(element, CaptionedImage, props)
    if (mountedApp) mounted.push(mountedApp)
  })

  root.querySelectorAll('image-card').forEach((element) => {
    const el = element as HTMLElement
    const srcAsset = resolveContentAssetMeta(options.contentDir, el.dataset.src)

    const props = {
      src: srcAsset.url,
      srcFound: srcAsset.found,
      srcReason: srcAsset.reason || '',
      alt: el.dataset.alt || '',
      caption: el.dataset.caption || '',
      tag: el.dataset.tag || '',
      href: el.dataset.href || '',
    }

    const mountedApp = mountOne(element, ImageCard, props)
    if (mountedApp) mounted.push(mountedApp)
  })

  root.querySelectorAll('callout-box').forEach((element) => {
    const el = element as HTMLElement
    const props = {
      type: el.dataset.type || 'note',
      title: stringAttr(el.dataset.title, ''),
      html: el.innerHTML,
    }

    const mountedApp = mountOne(element, CalloutBox, props)
    if (mountedApp) mounted.push(mountedApp)
  })



  root.querySelectorAll('section-gap').forEach((element) => {
    const el = element as HTMLElement
    const props = {
      size: stringAttr(el.dataset.size, 'md'),
      height: numberAttr(el.dataset.height, 0),
    }

    const mountedApp = mountOne(element, SectionGap, props)
    if (mountedApp) mounted.push(mountedApp)
  })

  root.querySelectorAll('section-break').forEach((element) => {
    const el = element as HTMLElement
    const props = {
      label: stringAttr(el.dataset.label, ''),
      tone: stringAttr(el.dataset.tone, 'quiet'),
    }

    const mountedApp = mountOne(element, SectionBreak, props)
    if (mountedApp) mounted.push(mountedApp)
  })


  root.querySelectorAll('featured-works').forEach((element) => {
    const el = element as HTMLElement
    const props = {
      pages: options.pages,
      title: stringAttr(el.dataset.title, ''),
      kind: stringAttr(el.dataset.kind, ''),
      items: parseListAttr(el.dataset.items),
      layout: stringAttr(el.dataset.layout, 'grid'),
      limit: numberAttr(el.dataset.limit, 12),
    }

    const mountedApp = mountOne(element, FeaturedWorksGrid, props)
    if (mountedApp) mounted.push(mountedApp)
  })




  root.querySelectorAll('home-section').forEach((element) => {
    const el = element as HTMLElement
    const props = {
      pages: options.pages,
      title: stringAttr(el.dataset.title, ''),
      source: stringAttr(el.dataset.source, 'all'),
      featured: boolAttr(el.dataset.featured, false),
      limit: numberAttr(el.dataset.limit, 6),
      layout: stringAttr(el.dataset.layout, 'card-grid'),
      status: stringAttr(el.dataset.status, ''),
      tags: stringAttr(el.dataset.tags, '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      showUnavailable: boolAttr(el.dataset.showUnavailable, false),
      emptyMode: stringAttr(el.dataset.emptyMode, 'notice'),
      emptyTitle: stringAttr(el.dataset.emptyTitle, 'No entries yet.'),
      emptyBody: stringAttr(el.dataset.emptyBody, ''),
      emptyHref: stringAttr(el.dataset.emptyHref, ''),
      emptyLabel: stringAttr(el.dataset.emptyLabel, ''),
    }

    const mountedApp = mountOne(element, HomeSection, props)
    if (mountedApp) mounted.push(mountedApp)
  })


  root.querySelectorAll('store-navigation-rail').forEach((element) => {
    const el = element as HTMLElement
    const props = {
      pages: options.pages,
      title: stringAttr(el.dataset.title, 'Store Navigation'),
      intro: stringAttr(el.dataset.intro, ''),
      mode: stringAttr(el.dataset.mode, 'categories'),
      currentCategory: stringAttr(el.dataset.currentCategory, ''),
      currentCollection: stringAttr(el.dataset.currentCollection, ''),
      showCounts: boolAttr(el.dataset.showCounts, true),
      showEmpty: boolAttr(el.dataset.showEmpty, false),
      includeAllLink: boolAttr(el.dataset.includeAllLink, true),
      allHref: stringAttr(el.dataset.allHref, '/products'),
      categoriesHrefBase: stringAttr(el.dataset.categoriesHrefBase, '/products/categories'),
      collectionsHrefBase: stringAttr(el.dataset.collectionsHrefBase, '/products/collections'),
      emptyLabel: stringAttr(el.dataset.emptyLabel, '준비 중'),
    }

    const mountedApp = mountOne(element, StoreNavigationRail, props)
    if (mountedApp) mounted.push(mountedApp)
  })


  root.querySelectorAll('product-catalog').forEach((element) => {
    const el = element as HTMLElement
    const props = {
      pages: options.pages,
      title: stringAttr(el.dataset.title, 'Product Catalog'),
      intro: stringAttr(el.dataset.intro, ''),
      limit: numberAttr(el.dataset.limit, 48),
      showUnavailable: boolAttr(el.dataset.showUnavailable, true),
      showCategoryFilter: boolAttr(el.dataset.showCategoryFilter, true),
      showSubcategoryFilter: boolAttr(el.dataset.showSubcategoryFilter, false),
      showCollectionFilter: boolAttr(el.dataset.showCollectionFilter, true),
      defaultStatus: stringAttr(el.dataset.defaultStatus, 'all'),
      defaultType: stringAttr(el.dataset.defaultType, 'all'),
      defaultCategory: stringAttr(el.dataset.defaultCategory, 'all'),
      defaultSubcategory: stringAttr(el.dataset.defaultSubcategory, 'all'),
      defaultCollection: stringAttr(el.dataset.defaultCollection, 'all'),
      defaultTag: stringAttr(el.dataset.defaultTag, 'all'),
      defaultQuery: stringAttr(el.dataset.defaultQuery, ''),
      defaultSort: stringAttr(el.dataset.defaultSort, 'order'),
      emptyTitle: stringAttr(el.dataset.emptyTitle, '상품이 없습니다'),
      emptyBody: stringAttr(el.dataset.emptyBody, '필터 조건을 바꾸거나 전체 상품으로 돌아가세요.'),
    }

    const mountedApp = mountOne(element, ProductCatalog, props)
    if (mountedApp) mounted.push(mountedApp)
  })


  root.querySelectorAll('inquiry-form, [data-vt-component="inquiry-form"]').forEach((element) => {
    const el = element as HTMLElement
    const props = {
      title: stringAttr(el.dataset.title, '문의하기'),
      intro: stringAttr(el.dataset.intro, '닉네임과 제출 확인용 코드를 입력한 뒤 문의를 남겨주세요.'),
      requireNickname: boolAttr(el.dataset.requireNickname, true),
      requireGateCode: boolAttr(el.dataset.requireGateCode, true),
      requireEmail: boolAttr(el.dataset.requireEmail, false),
      submitLabel: stringAttr(el.dataset.submitLabel, '문의 남기기'),
    }

    const mountedApp = mountOne(element, InquiryForm, props)
    if (mountedApp) mounted.push(mountedApp)
  })




  root.querySelectorAll('product-variant-selector').forEach((element) => {
    const el = element as HTMLElement
    const page = options.page
    const frontmatter = page?.frontmatter
    const props = {
      title: stringAttr(el.dataset.title, 'Choose a license option'),
      product: frontmatter?.product || null,
      showPrice: boolAttr(el.dataset.showPrice, true),
    }

    const mountedApp = mountOne(element, ProductVariantSelector, props)
    if (mountedApp) mounted.push(mountedApp)
  })

  root.querySelectorAll('claim-portal, [data-vt-component="claim-portal"]').forEach((element) => {
    const el = element as HTMLElement
    const props = { title: stringAttr(el.dataset.title, '구매 파일 수령'), intro: stringAttr(el.dataset.intro, ''), requireClaimToken: boolAttr(el.dataset.requireClaimToken, true), requireEmail: boolAttr(el.dataset.requireEmail, false), requireOrderId: boolAttr(el.dataset.requireOrderId, false), submitLabel: stringAttr(el.dataset.submitLabel, '수령 정보 확인') }
    const mountedApp = mountOne(element, ClaimPortal, props)
    if (mountedApp) mounted.push(mountedApp)
  })


  root.querySelectorAll('product-cta').forEach((element) => {
    const page = options.page
    const frontmatter = page?.frontmatter
    const slug = page?.slug || ''
    const props = {
      title: frontmatter?.title || slug || 'Untitled product',
      description: frontmatter?.description || frontmatter?.summary || '',
      product: frontmatter?.product || null,
      href: slug === 'home' ? '/' : slug ? `/${slug}` : '',
    }

    const mountedApp = mountOne(element, ProductDetailCta, props)
    if (mountedApp) mounted.push(mountedApp)
  })



  root.querySelectorAll('product-specs').forEach((element) => {
    const page = options.page
    const frontmatter = page?.frontmatter
    const props = {
      title: frontmatter?.title || page?.slug || 'Untitled product',
      product: frontmatter?.product || null,
    }

    const mountedApp = mountOne(element, ProductSpecBlocks, props)
    if (mountedApp) mounted.push(mountedApp)
  })

  root.querySelectorAll('product-trust').forEach((element) => {
    const page = options.page
    const frontmatter = page?.frontmatter
    const props = {
      title: frontmatter?.title || page?.slug || 'Untitled product',
      product: frontmatter?.product || null,
    }

    const mountedApp = mountOne(element, ProductTrustBlocks, props)
    if (mountedApp) mounted.push(mountedApp)
  })

  root.querySelectorAll('pagecard-grid').forEach((element) => {
    const el = element as HTMLElement
    const props = {
      pages: options.pages,
      contentDir: options.contentDir,
      items: parseJsonAttr(el.dataset.items, []),
      query: stringAttr(el.dataset.query, ''),
      tag: stringAttr(el.dataset.tag, ''),
      section: stringAttr(el.dataset.section, ''),
      featured: boolAttr(el.dataset.featured, false),
      limit: numberAttr(el.dataset.limit, 24),
      sort: normalizeSort(el.dataset.sort),
      columns: normalizeColumns(el.dataset.columns),
    }

    const mountedApp = mountOne(element, PagecardGrid, props)
    if (mountedApp) mounted.push(mountedApp)
  })

  root.querySelectorAll('markdown-box').forEach((element) => {
    const el = element as HTMLElement
    const template = el.querySelector('template[data-markdown-box-html]') as HTMLTemplateElement | null
    const props = {
      type: stringAttr(el.dataset.type, 'note'),
      title: stringAttr(el.dataset.title, ''),
      tone: stringAttr(el.dataset.tone, ''),
      icon: stringAttr(el.dataset.icon, ''),
      collapsible: boolAttr(el.dataset.collapsible, false),
      defaultOpen: boolAttr(el.dataset.defaultOpen, true),
      html: template?.innerHTML || '',
    }

    const mountedApp = mountOne(element, MarkdownBox, props)
    if (mountedApp) mounted.push(mountedApp)
  })


  root.querySelectorAll('demo-frame').forEach((element) => {
    const el = element as HTMLElement
    const props = {
      id: stringAttr(el.dataset.id, ''),
      src: stringAttr(el.dataset.src, ''),
      title: stringAttr(el.dataset.title, ''),
      ratio: stringAttr(el.dataset.ratio, ''),
      status: stringAttr(el.dataset.status, ''),
      description: stringAttr(el.dataset.description, ''),
      stack: parseListAttr(el.dataset.stackJson || el.dataset.stack),
      sandbox: stringAttr(el.dataset.sandbox, ''),
      allowFullscreen: boolAttr(el.dataset.allowFullscreen || el.dataset.allowfullscreen, true),
      autoResize: boolAttr(el.dataset.autoResize || el.dataset.autoresize, true),
      minHeight: numberAttr(el.dataset.minHeight, 360),
      maxHeight: numberAttr(el.dataset.maxHeight, 1200),
      html: templateHtml(el, 'template[data-demo-frame-html]'),
    }

    const mountedApp = mountOne(element, DemoFrame, props)
    if (mountedApp) mounted.push(mountedApp)
  })


  root.querySelectorAll('gallery-strip').forEach((element, galleryIndex) => {
    const el = element as HTMLElement
    const template = el.querySelector('template[data-gallery-strip-items]') as HTMLTemplateElement | null
    const parsedItems = parseGalleryStripItems(template?.innerHTML || '')
    const items = parsedItems.map((item) => {
      const srcAsset = resolveContentAssetMeta(options.contentDir, item.src)
      const thumbAsset = item.thumb ? resolveContentAssetMeta(options.contentDir, item.thumb) : null
      return {
        src: srcAsset.url,
        thumbSrc: thumbAsset?.found ? thumbAsset.url : '',
        alt: item.caption,
        title: item.title,
        caption: item.caption,
        meta: item.meta,
        source: item.src,
        thumbSource: item.thumb,
        srcFound: srcAsset.found,
        thumbFound: thumbAsset?.found,
        srcReason: srcAsset.reason || '',
        thumbReason: thumbAsset?.reason || '',
      }
    })

    const props = {
      title: stringAttr(el.dataset.title, ''),
      caption: stringAttr(el.dataset.caption, ''),
      layout: normalizeGalleryLayout(el.dataset.layout),
      lightbox: boolAttr(el.dataset.lightbox, true),
      groupId: `manual-gallery-${galleryIndex + 1}`,
      items,
    }

    const mountedApp = mountOne(element, GalleryStrip, props)
    if (mountedApp) mounted.push(mountedApp)
  })

  root.querySelectorAll('work-card').forEach((element) => {
    const el = element as HTMLElement
    const props = {
      pages: options.pages,
      contentDir: options.contentDir,
      slug: stringAttr(el.dataset.slug, ''),
      title: stringAttr(el.dataset.title, ''),
      description: stringAttr(el.dataset.description, ''),
      cover: stringAttr(el.dataset.cover, ''),
      href: stringAttr(el.dataset.href, ''),
      tag: stringAttr(el.dataset.tag, ''),
    }

    const mountedApp = mountOne(element, WorkCard, props)
    if (mountedApp) mounted.push(mountedApp)
  })

  return () => {
    mounted.forEach(({ app, element }) => {
      app.unmount()
      delete (element as HTMLElement).dataset.vtMounted
    })
  }
}
