# CMS-207N-R1

WORKS-TOC-CURRENT-UI-AUTHORITY-REALIGNMENT /
DESKTOP-STITCH-EXPLORE-RAIL-ADOPTION /
INLINE-FILTER-HEADING-RETIREMENT /
OBSERVED-RESULTS-HEADING-PRESERVATION /
NO-STALE-UI-CONTRACT

## Authority

- CMS-207N-R1 owns WorksPage MarkdownToc integration, observed headings, active heading binding, worksRoot observation scope, and the visible `works-results-heading` contract.
- VT-UI-21A-R2 owns the explore/filter surface placement and geometry through `WorkIndexDesktopStitchRail`.
- `works-filter-heading` is retired and must not be reintroduced, including hidden compatibility headings.
- CMS-207N-R1 must not duplicate VT-UI-21A-R2 rail geometry assertions.

## Required WorksPage contract

- `useObservedHeadings(worksRoot)`
- `useActiveHeading(worksRoot, headings)`
- `<MarkdownToc :headings="headings" :active-heading-id="activeHeadingId" />`
- `<WorkIndexDesktopStitchRail ... anchor-selector=".vt-work-index-main" />`
- `ref="worksRoot"`
- `data-vt-ui21a-r2-work-index-main-anchor="true"`
- `<section aria-labelledby="works-results-heading">`
- visible `<h2 id="works-results-heading">공개 콘텐츠</h2>` inside the worksRoot scope

## Forbidden stale contract

- positive requirement for `works-filter-heading`
- `CMS_207N_WORKS_FILTER_HEADING_MISSING`
- `WorksPage must expose 탐색 h2 heading`
- hidden/sr-only compatibility restoration of the retired inline heading

## Mutation boundary

No Vue runtime change. No CSS change. No WorksPage layout change. No Worker, D1, R2, WASM, or Pages deployment semantic change.

## Seal

`PASS_CMS_207N_R1_WORKS_TOC_CURRENT_UI_AUTHORITY_REALIGNMENT`
