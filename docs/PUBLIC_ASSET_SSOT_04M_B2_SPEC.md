# PUBLIC-ASSET-SSOT-04M-B2

## Title
Current Route Lazy Markdown Loader / No Full Markdown Manifest On Detail Entry / Stale Route Guard Seal

## Goal
`MarkdownPage.vue` must not load and render the full markdown manifest just to display one current route page. The detail route should resolve the current route slug, import only the matching markdown raw module, render only that document, and protect against stale async route loads.

## SSOT

### Route lookup SSOT
- `src/markdown/markdownRouteIndex.generated.ts`
- Owns `slug -> contentDir` mapping.
- Must not contain raw markdown, rendered html, or headings.

### Full markdown render SSOT
- `src/markdown/loadMarkdownPageFromSource.ts`
- Owns `raw markdown + contentDir -> LoadedMarkdownPage`.
- Shared by legacy eager loader and new lazy route loader.

### Lazy module SSOT
- `src/markdown/lazyMarkdownPageLoader.ts`
- Owns current slug lookup, lazy module import, and VACMS live fallback.
- Uses `import.meta.glob` without `eager: true`.

### Route load state owner
- `src/pages/MarkdownPage.vue`
- Owns `idle/loading/ready/not_found/error`, current page state, and stale request guard.

## Scope

### New files
- `src/markdown/loadMarkdownPageFromSource.ts`
- `src/markdown/lazyMarkdownPageLoader.ts`
- `src/markdown/markdownRouteIndex.generated.ts`
- `scripts/build-markdown-route-index.mjs`
- `scripts/smoke-public-asset-ssot-04m-b2-current-route-lazy-markdown.mjs`

### Modified files
- `src/markdown/loadMarkdownPages.ts`
- `src/pages/MarkdownPage.vue`
- `src/components/markdown/MarkdownDocumentView.vue`

## Non-goals
- HomePage full fast path.
- Recent/Featured lightweight index migration.
- Markdown island async registry.
- CSS chunk split.
- D1/R2 metadata model.

## Policy

### MarkdownPage.vue
- Must not import `useRouteManifest`.
- Must not call `loadMarkdownPages`.
- Must call `loadMarkdownPageBySlug`.
- Must use request id or equivalent stale guard.
- Must pass `show-related-footer=false` in lazy route mode.

### MarkdownDocumentView.vue
- `pages` becomes optional.
- Default `pages` is `[]`.
- Work detail footer requires non-empty pages.

### Route index builder
- Scans `src/content/pages/**/index.md`.
- Reads only frontmatter slug and contentDir.
- Must not call `renderMarkdownPage`.
- Supports `--check` stale detection.

## PASS token
`PASS_PUBLIC_ASSET_SSOT_04M_B2_CURRENT_ROUTE_LAZY_MARKDOWN`
