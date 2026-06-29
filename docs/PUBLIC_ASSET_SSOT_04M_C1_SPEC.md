# PUBLIC-ASSET-SSOT-04M-C1

## Critical Render Path CSS Split / No Non-Critical Global CSS On Entry / Render Blocking Request Reduction Seal

### Goal

Reduce render-blocking CSS requests on the public site entry path.

### Confirmed inputs

Lighthouse reported render-blocking CSS requests:

- `/assets/index-*.css`
- `https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable.css`

The Pretendard request was caused by `src/styles/typography.css` using an external `@import`.

### State ownership

- `src/styles/typography.css`
  - Owns critical typography tokens and fallback font stack.
  - Must not own external font CSS loading.

- `src/main.ts`
  - Owns only entry-critical global CSS imports.
  - Must not import command palette, search page, or lightbox CSS.

- `src/components/CommandPalette.vue`
  - Owns command palette CSS.

- `src/pages/SearchPage.vue`
  - Owns search page CSS.

- `src/components/markdown/MarkdownLightbox.vue`
  - Owns markdown lightbox CSS.

### Changes

1. Remove JSDelivr Pretendard `@import` from `typography.css`.
2. Use a system font stack as the critical `--vt-font-sans` value.
3. Keep `--vt-font-brand` as a non-blocking brand token for future self-hosted font work.
4. Remove these CSS imports from `main.ts`:
   - `command-palette.css`
   - `page-search.css`
   - `markdown-lightbox.css`
5. Reconnect those styles in their owning component/route.

### PASS token

`PASS_PUBLIC_ASSET_SSOT_04M_C1_CRITICAL_RENDER_CSS_SPLIT`

### PASS conditions

- `typography.css` contains no `cdn.jsdelivr.net`.
- `typography.css` contains no external `@import url('https://...')`.
- `main.ts` does not import command palette CSS.
- `main.ts` does not import page search CSS.
- `main.ts` does not import markdown lightbox CSS.
- Each removed stylesheet is reattached to the route/component that owns it.
- `npm run build` passes.
- Lighthouse no longer lists JSDelivr Pretendard CSS as a render-blocking request.

### Non-goals

- Do not add font files to the repository.
- Do not implement cache headers.
- Do not rewrite all CSS architecture.
- Do not async-split markdown island components.
