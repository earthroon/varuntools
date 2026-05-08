# Commit 99 Migration: Portfolio responsive and accessibility polish

`refactor(portfolio): polish responsive detail page layout and accessibility`

## Added

- `scripts/smoke-portfolio-accessibility.mjs`
- `smoke:portfolio-accessibility`
- Portfolio accessibility documentation

## Changed

- `PortfolioHero` now computes a stable image alt fallback.
- `CaseGallery` buttons include `aria-label` and caption descriptions.
- Missing gallery media receives disabled styling.
- `MetricCard` value output has an accessibility label and remains static.
- `markdown-portfolio.css` receives mobile, focus-visible, disabled, and density polish.
- `HomeFeaturedWorks` receives small density/focus polish without changing selection logic.

## Non-goals

No homepage redesign, search, SEO, sitemap, lightbox expansion, animation, or CSV syntax changes were added.
