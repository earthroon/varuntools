# VT-UI-14B Header Navigation Markdown Prefetch Cache

## Title

VT-UI-14B

Header Navigation Markdown Prefetch Cache /
Warm Products Wiper Markdown Routes /
No Cold Markdown Paint Flash /
No Cognitive Flicker

## Problem

Desktop header navigation can still show a perceptible route paint flash when moving between Work, Products, and Before/After pages. VT-UI-14 and VT-UI-14A remove product and loading fallback leakage, but cold markdown raw module loading can still occur after the user clicks.

## SSOT

Primary SSOT is the normalized markdown slug. The cache owner is `src/markdown/lazyMarkdownPageLoader.ts`; the navigation intent trigger owner is `src/components/layout/SiteNavigationLink.vue`; the display owner remains `src/pages/MarkdownPage.vue`.

Operator rule:

```txt
누르기 전에 데워.
클릭하고 나서 준비하지 마.
플리커 나면 꽝.
```

## Implementation

- Add `pageCache` to `lazyMarkdownPageLoader.ts`.
- Add `pendingLoads` to dedupe concurrent requests for the same slug.
- Make `loadMarkdownPageBySlug()` return a cache hit immediately.
- Cache only successful `LoadedMarkdownPage` results.
- Do not cache not-found results.
- Export `prefetchMarkdownPageBySlug()` and swallow failures.
- In `SiteNavigationLink.vue`, warm internal markdown targets on `pointerenter`, `focus`, and `click`.
- Skip external links and static routes such as `/`, `/works`, `/index`, `/search`, and `/404`.

## Non-goals

- Do not reintroduce keyed `RouterView` remounts.
- Do not clear `page.value` during the MarkdownPage loading prologue.
- Do not change Markdown renderer or CMS content models.
- Do not implement a product page feature.

## Verification

```powershell
npm run smoke:vt-ui-14b-markdown-prefetch-cache
npm run smoke:vt-ui-14a-markdown-route-loading-flicker-guard
npm run build
```

## Manual QA

1. Open the desktop site.
2. Go to `/works`.
3. Hover Products, then click.
4. Hover Before/After, then click.
5. Repeat Work / Products / Before-After navigation quickly.
6. Confirm that no loading or placeholder fallback flicker appears.

## PASS tokens

```txt
PASS_VT_UI_14B_HEADER_NAVIGATION_MARKDOWN_PREFETCH_CACHE
PASS_VT_UI_14B_WARM_PRODUCTS_WIPER_MARKDOWN_ROUTES
PASS_VT_UI_14B_NO_COLD_MARKDOWN_PAINT_FLASH
PASS_VT_UI_14B_NO_COGNITIVE_FLICKER
```
