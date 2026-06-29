# PUBLIC-ASSET-SSOT-04M-U1

Mobile TOC Relocation / Floating Control Collision Guard / Mobile Page Gutter + Late Container Reserve Seal

## Intent

Mobile UI has two floating controls competing for the same bottom-right zone:

- Command palette/search trigger owns the bottom-right zone.
- Markdown TOC must move to the top-left zone on mobile.

The mobile page also needs additional horizontal gutter and min-height reservation for late-entering home containers to reduce visible jumps.

## SSOT

### Floating control zones

- `.vt-command-trigger`: right-bottom, unchanged.
- `.vt-toc`: mobile left-top, safe-area aware.

### Mobile gutter

- `--vt-mobile-page-gutter` owns mobile horizontal page gutter.
- `src/styles/markdown.css` owns markdown page padding.
- `src/styles/site-navigation.css` aligns header/footer width to the same gutter.

### Late container reservation

- `.vt-home-late-container--recent` reserves recent section height.
- `.vt-home-late-container--featured` reserves featured section height.
- `.vt-home-recent-public-content` and `.vt-home-featured-works` also receive min-height and intrinsic-size fallback.

## Modified files

- `src/styles/markdown-toc.css`
- `src/styles/markdown.css`
- `src/styles/site-navigation.css`
- `src/styles/markdown-works.css`
- `src/pages/HomePage.vue` optional wrapper patch
- `src/components/home/HomeRecentPublicContent.vue` optional scoped width patch

## PASS token

`PASS_PUBLIC_ASSET_SSOT_04M_U1_MOBILE_TOC_GUTTER_RESERVE`

## Non-goals

- Do not move the command/search trigger.
- Do not remove CommandPalette.
- Do not change markdown route loading.
- Do not introduce new JS runtime measurement.
