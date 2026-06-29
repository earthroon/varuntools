# PUBLIC-ASSET-SSOT-04M-B3-R2

## Home Critical Render Stability / Sync Home Document / No Deferred Collection Mount / No Runtime Home Swap Seal

### Background

04M-B3 reduced full markdown manifest dependency on the home route, but it moved the home document and home collection sections behind asynchronous/deferred gates. Lighthouse showed worse FCP/LCP and a large CLS. The issue was not main-thread blocking. The issue was critical content timing and late layout insertion.

### Goal

- Keep the B3 home fast path: no `useRouteManifest` on `HomePage.vue`.
- Render the home markdown document synchronously from the one known home markdown source.
- Do not use `loadMarkdownPageBySlug('home')` for the home page.
- Do not defer `HomeRecentPublicContent` or `HomeFeaturedWorks` with `afterFirstPaint` or `v-if`.
- Render home collection cards from `homeCollections.generated.json` immediately.
- Do not swap the home recent section to runtime public index entries after first paint.
- Preserve B1 runtime public index defer behavior for other consumers.

### State ownership

- `HomePage.vue` owns critical home render order.
- `loadMarkdownPageFromSource.ts` owns raw markdown to `LoadedMarkdownPage` conversion.
- `useHomeCollections.ts` owns lightweight generated home collection entries.
- `HomeRecentPublicContent.vue` renders stable generated recent entries only.
- `HomeFeaturedWorks.vue` renders stable generated featured work entries only.

### PASS token

`PASS_PUBLIC_ASSET_SSOT_04M_B3_R2_HOME_CRITICAL_RENDER_STABILITY`

### Non-goals

- No full rollback to `useRouteManifest`.
- No B2 rollback.
- No Worker, D1, R2, or routing changes.
- No markdown island async registry work.
