# Portfolio accessibility and responsive contract

Commit 99 polishes the portfolio detail components without redesigning the site.

## Scope

The contract covers:

- `PortfolioHero`
- `CaseSection`
- `MetricCard`
- `CaseGallery`
- `CaseGalleryItem`
- `PortfolioRelatedWorks`
- `HomeFeaturedWorks` density polish

## Rules

- Images must have a fallback `alt` value.
- Gallery buttons must expose `aria-label`.
- Gallery captions should be connected with `aria-describedby` when present.
- Missing media must be visually disabled and announced as missing state.
- Focusable links and gallery buttons must have `:focus-visible` styles.
- Mobile layouts must collapse to one column without horizontal overflow.
- Metric cards must not invent or animate numbers.
- Existing `var(--vt-*)` design tokens remain the visual SSOT.

## Non-goals

This commit does not add a new visual brand, lightbox behavior, search, SEO, sitemap generation, or new CSV syntax.
