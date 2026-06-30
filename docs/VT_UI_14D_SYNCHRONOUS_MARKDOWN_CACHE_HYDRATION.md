# VT-UI-14D

Synchronous Markdown Cache Hydration /
Cold Mount Cached Page First Paint /
Viewport Public Content Prewarm /
No Async First Paint Flicker

## Problem

VT-UI-14B and VT-UI-14C add markdown prefetch to header navigation and public content cards. If MarkdownPage still mounts with `page = null` and then awaits an async cache hit, a first-paint flicker can remain.

## SSOT

- Primary SSOT: normalized markdown slug
- Cache owner: `src/markdown/lazyMarkdownPageLoader.ts`
- Hydration owner: `src/pages/MarkdownPage.vue`
- Viewport prewarm owner: `src/components/content/ContentCollectionGrid.vue`
- Event warm owner: `SiteNavigationLink.vue` and `WorkCard.vue`

## Contract

- `readCachedMarkdownPageBySlug(rawSlug)` is synchronous and returns a cached page without creating a Promise.
- MarkdownPage initializes its page ref from the synchronous cache.
- MarkdownPage checks synchronous cache before async load in the slug watcher.
- WorkCard and SiteNavigationLink also warm on pointerdown for touch/fast clicks.
- ContentCollectionGrid prewarms the first visible public content hrefs at idle/timeout.
- No RouterView keyed remount is reintroduced.
- No loading-time `page.value = null` is reintroduced.

## PASS

- cached markdown route first paint has a page
- public content card click has no async first-paint blank
- viewport first entries are prewarmed
- 14A/14B/14C smoke and build pass
