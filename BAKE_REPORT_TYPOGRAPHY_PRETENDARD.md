# VARUNTOOLS Typography Bake Report — Pretendard

## SSOT

- Main Vue entry: `src/main.ts`
- Typography override file: `src/styles/typography.css`
- Production build output: `dist/`

## Applied contract

- Font family: Pretendard Variable / Pretendard
- H1: Black, `font-weight: 900`
- H2: Bold, `font-weight: 700`
- H3: SemiBold, `font-weight: 600`
- Body text: Light, `font-weight: 300`
- Letter spacing: `-0.03em`

## Implementation notes

- Added `src/styles/typography.css` as a dedicated typography SSOT.
- Imported `typography.css` at the end of `src/main.ts`, after existing theme/style imports, so the requested type contract wins over older component and markdown style declarations.
- Did not bundle or redistribute any font files. Pretendard is loaded as a remote webfont CSS import.
- Kept existing Vue structure and route/component files untouched.

## Verification

- `npm run build` completed successfully.
- Content validation passed: 22 markdown pages checked, 0 errors, 0 warnings.
- Vite production build completed and regenerated `dist/404.html` SPA fallback.
