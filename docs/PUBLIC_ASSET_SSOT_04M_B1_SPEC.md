# PUBLIC-ASSET-SSOT-04M-B1

## Mobile Entry Fast Path B1

Goal:
- Reduce mobile entry delay without changing markdown routing semantics.
- Defer runtime public content index fetch until after first paint or browser idle.
- Remove cache-busting Date.now from public-content-index.json.
- Remove cache: no-store from runtime index fetch.
- Skip runtime index fetch when Save-Data is enabled.
- Remove direct CommandPalette import from App.vue.
- Load CommandPalette through CommandPaletteShell after first paint.

Non-goals:
- Do not remove all markdown eager rendering yet.
- Do not rewrite the router.
- Do not introduce SSR.
- Do not change D1/R2/Worker routing.
- Do not change video player layout SSOT.

Files:
- src/utils/afterFirstPaint.ts
- src/components/CommandPaletteShell.vue
- src/App.vue
- src/composables/useRuntimePublicContentIndex.ts
- scripts/smoke-public-asset-ssot-04m-b1-mobile-entry-fast-path.mjs

PASS:
- afterFirstPaint utility exists.
- App.vue imports CommandPaletteShell, not CommandPalette.vue.
- CommandPaletteShell uses defineAsyncComponent for CommandPalette.vue.
- useRuntimePublicContentIndex defers fetch through afterFirstPaintAsync.
- useRuntimePublicContentIndex has Save-Data skip.
- useRuntimePublicContentIndex has no Date.now cache buster.
- useRuntimePublicContentIndex has no cache: no-store.
- npm run build passes.

FAIL:
- App.vue directly imports CommandPalette.vue.
- Runtime public index fetch starts immediately on mount without deferred gate.
- Runtime public index uses Date.now or ?v= cache buster.
- Runtime public index uses cache: no-store.
- Save-Data still forces runtime public index fetch.
