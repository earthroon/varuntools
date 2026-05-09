# VARUNTOOLS GitHub Actions Build Fix Report

## Verification

- `npm run typecheck`: passed
- `npm run build`: passed
- `validate:content`: OK, 0 errors, 0 warnings
- Vite production build: passed
- SPA fallback `dist/404.html`: generated during local verification

## Patched areas

### TypeScript build blockers

1. `src/navigation/sectionNavigation.ts`
   - Added `hasSurface(item, surface)` helper.
   - Prevents readonly literal tuple union from making `surface.includes()` accept `never`.

2. `src/media/ewa/ewaTypes.ts`
   - Added local `EwaGpuTextureFormat` alias.
   - Replaced direct `GPUTextureFormat` dependency so GitHub Actions does not require WebGPU ambient types.

3. `src/media/ewa/ewaCanvasPresenter.ts`
   - Uses `EwaGpuTextureFormat` from `ewaTypes.ts`.

4. `src/media/ewa/ewaGalleryProcessor.ts`
   - Replaced `recentTotalMs.at(-1)` with ES2020-safe indexing.
   - Assigned adaptive tile output to a narrowed `adaptiveOutput` const before reading `tileDiagnostics`.

5. `src/types/workTaxonomy.ts`
   - Widened dynamic work filter/token records to accept runtime taxonomy strings.
   - Fixes route/query-derived filters passed into `filterWorks()`.

### Content validation blockers found after typecheck passed

6. `src/content/pages/products/dummy-catalog/index.md`
   - Changed `robots` from YAML array to validator-compatible scalar string.

7. `src/content/pages/products/spec-playground/index.md`
   - Added missing `slug` and `kind`.
   - Changed `robots` to validator-compatible scalar string.
   - Added `product-cta` and `product-trust` directives.

8. `src/content/pages/qa/ewa-gallery/index.md`
   - Changed hidden QA page `kind` from invalid `qa` to allowed `lab`.

9. `src/content/pages/works/index.md`
   - Changed content slug from reserved app route `works` to `docs/works`.
   - Corrected pagecard links to current content slugs.

10. `src/content/pages/lab-markdown-gallery/index.md`
    - Corrected pagecard/image-card hrefs from stale `/tools/wiper` and `/lab/markdown-gallery` to actual slugs.

11. `src/content/pages/wiper/index.md`
    - Corrected related slug from stale `lab/markdown-gallery` to `lab-markdown-gallery`.

12. CSV source alignment
    - Updated matching CSV metadata for product/QA pages where regeneration could reintroduce the same validation failure.

## Notes

- `dist/` and `node_modules/` are intentionally excluded from the patched zip.
- The patched source is designed for GitHub Actions to run the normal build pipeline again.
