# PUBLIC-ASSET-SSOT-04M-U1-R2

## Header-Zone TOC Dock / Vue-Owned Scroll-Idle Visibility Gate / Late Container Min-Height Reserve Seal

### Purpose

Move the mobile document table-of-contents control out of the reading flow and into the visual header-zone top-right area without relying on CSS-only placement. The TOC must be hidden during active scroll, close its panel when scrolling starts, and reappear only after scroll idle.

### SSOT

- `src/components/markdown/MarkdownToc.vue` owns mobile TOC position, scroll state, panel close behavior, and inline placement styles.
- `src/styles/markdown-toc.css` remains visual chrome only. It must not be the placement authority for mobile TOC docking.
- `src/components/home/HomeRecentPublicContent.vue` owns recent-section reserve space.
- `src/styles/markdown-works.css` owns featured-works reserve space.

### Required behavior

- Mobile TOC docks to the right side of `.vt-site-header` by measuring the actual header rectangle in Vue.
- Mobile TOC root uses Vue-computed inline style for `top`, `right`, `left:auto`, `bottom:auto`, `opacity`, `pointer-events`, and `transform`.
- Mobile TOC panel uses Vue-computed inline style for top-right anchoring.
- Scroll start closes any open TOC panel.
- While scrolling, the TOC button is hidden and non-interactive.
- After `420ms` scroll idle, the TOC button becomes visible again.
- Desktop rail behavior remains unchanged.
- Command palette search button keeps the bottom-right zone.
- Late home containers reserve min-height to reduce layout shifts.

### Non-goals

- No Teleport to the header DOM.
- No SiteHeader component rewrite.
- No CommandPalette behavior change.
- No CSS-only TOC placement patch.
- No VideoPlayer min-height override.

### PASS token

`PASS_PUBLIC_ASSET_SSOT_04M_U1_R2_VUE_OWNED_MOBILE_TOC`
