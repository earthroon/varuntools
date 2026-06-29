# PUBLIC-ASSET-SSOT-04M-B3

## Title
Home Fast Path / Home Document Only / Lightweight Home Collections / No Full Markdown Manifest On Home Entry Seal

## Goal
Make the home route render the home markdown document without loading and rendering every markdown page. Recent and featured home sections must use a lightweight generated collection index instead of a full `LoadedMarkdownPage[]` manifest.

## SSOT

### Home document SSOT
- Owner: `src/pages/HomePage.vue`
- Loader: `src/markdown/lazyMarkdownPageLoader.ts`
- Policy: HomePage must call `loadMarkdownPageBySlug('home')` and must not call `useRouteManifest()`.

### Home collection SSOT
- Owner: `src/content/generated/homeCollections.generated.json`
- Builder: `scripts/build-home-collections.mjs`
- Runtime adapter: `src/composables/useHomeCollections.ts`
- Prohibited fields: `raw`, `html`, `headings`

### Runtime recent source
- Owner: `src/components/home/HomeRecentPublicContent.vue`
- Policy: generated home collections are available first. Runtime public index may replace recent entries only after the B1 deferred fetch path becomes ready.

## Modified files
- `src/pages/HomePage.vue`
- `src/components/home/HomeRecentPublicContent.vue`
- `src/components/home/HomeFeaturedWorks.vue`

## New files
- `src/content/generated/homeCollections.generated.json`
- `src/composables/useHomeCollections.ts`
- `scripts/build-home-collections.mjs`
- `scripts/smoke-public-asset-ssot-04m-b3-home-fast-path.mjs`

## Pass token
`PASS_PUBLIC_ASSET_SSOT_04M_B3_HOME_FAST_PATH`

## Pass conditions
- `HomePage.vue` does not import `useRouteManifest`.
- `HomePage.vue` does not import `findMarkdownPageBySlug`.
- `HomePage.vue` calls `loadMarkdownPageBySlug('home')`.
- `HomePage.vue` gates home collection sections through `afterFirstPaint`.
- `HomePage.vue` passes `show-related-footer=false` to `MarkdownDocumentView`.
- `HomeRecentPublicContent.vue` does not import `useRouteManifest`.
- `HomeRecentPublicContent.vue` does not import `usePublicContentCollection`.
- `HomeFeaturedWorks.vue` does not import `LoadedMarkdownPage`.
- `HomeFeaturedWorks.vue` does not import `getWorkCollectionEntries`.
- `HomeFeaturedWorks.vue` has no `pages` prop.
- `scripts/build-home-collections.mjs` does not call `renderMarkdownPage` or `loadMarkdownPages`.
- `homeCollections.generated.json` has no `raw`, `html`, or `headings` key.
- `npm run build` passes.

## Non-goals
- Do not optimize WorksPage, SearchPage, or PublicContentIndexPage in this patch.
- Do not convert the markdown island registry to async imports in this patch.
- Do not restore related footer via lightweight related index in this patch.
- Do not change Worker, D1, or R2 code.
