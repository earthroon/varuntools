# CMS-204AP Live Materialized Markdown Registry Source Rebind

This patch binds live VACMS materialized markdown into a stable generated registry module before Vite build.

## Seal

- `src/markdown/vacmsLivePages.generated.ts` is the empty committed fallback.
- `scripts/build-vacms-live-markdown-registry.mjs --workflow` overwrites it during live publish.
- `loadMarkdownPages()` merges glob pages and live generated pages.
- CMS-204AO remains the post-build bundle guard.

## Non-goals

- No dist asset manual patch.
- No force push.
- No VACMS Worker or D1 mutation.
