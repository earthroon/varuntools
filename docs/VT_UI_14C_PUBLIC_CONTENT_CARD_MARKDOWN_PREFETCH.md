# VT-UI-14C Public Content Card Markdown Prefetch

## Patch ID

VT-UI-14C

## Title

Public Content Card Markdown Prefetch / Warm WorkCard Internal Links / No Generated Post Cold Paint Flash / No Cognitive Flicker

## Problem

Public content cards rendered through `ContentCollectionGrid` and `WorkCard` can still trigger a cold markdown page load. Header navigation prefetch is not enough because users also enter generated posts and work detail pages through cards.

## SSOT

- Cache owner: `src/markdown/lazyMarkdownPageLoader.ts`
- Prefetch policy owner: `src/markdown/markdownNavigationPrefetch.ts`
- Card trigger owner: `src/components/markdown/WorkCard.vue`
- Header trigger owner: `src/components/layout/SiteNavigationLink.vue`
- Display owner: `src/pages/MarkdownPage.vue`

## Rules

- Warm internal markdown links before navigation.
- Do not prefetch external URLs.
- Do not prefetch hash-only links.
- Do not reintroduce keyed `RouterView` remounts.
- Do not clear `page.value` during the MarkdownPage loading prologue.
- Prefetch failures must stay quiet.

## Verification

```powershell
npm run smoke:vt-ui-14c-public-content-card-prefetch
npm run smoke:vt-ui-14b-markdown-prefetch-cache
npm run smoke:vt-ui-14a-markdown-route-loading-flicker-guard
npm run build
```

## Manual QA

1. Open `/works` or `/index` on desktop.
2. Hover a public content card.
3. Click the card.
4. Repeat with newly generated posts or pages.
5. Confirm no visible loading fallback, empty paint, or cognitive flicker.

## PASS tokens

- `PASS_VT_UI_14C_PUBLIC_CONTENT_CARD_MARKDOWN_PREFETCH`
- `PASS_VT_UI_14C_WARM_WORKCARD_INTERNAL_LINKS`
- `PASS_VT_UI_14C_NO_GENERATED_POST_COLD_PAINT_FLASH`
- `PASS_VT_UI_14C_NO_COGNITIVE_FLICKER`
