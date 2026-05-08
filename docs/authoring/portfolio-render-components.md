# Portfolio render components

Commit 95 connects portfolio CSV blocks to dedicated Markdown/Vue render components while keeping the existing Vue tone and markdown renderer conventions.

## SSOT

- CSV block contract: `scripts/lib/csv-block-schema.mjs`
- Markdown generation: `scripts/lib/csv-markdown.mjs`
- Directive registry: `src/markdown/directiveTypes.ts` and `src/markdown/directives/index.ts`
- Vue mounting: `src/markdown/mountMarkdownComponents.ts`
- Component styling: `src/styles/markdown-portfolio.css`

## Mapping

| CSV block | Markdown directive | Vue component |
| --- | --- | --- |
| `portfolio-hero` | `portfolio-hero` | `PortfolioHero.vue` |
| `work-summary` | `work-summary` | `WorkSummary.vue` |
| `role-stack` | `role-stack` | `RoleStack.vue` |
| `problem` | `case-section type=problem` | `CaseSection.vue` |
| `solution` | `case-section type=solution` | `CaseSection.vue` |
| `process` | `case-section type=process` | `CaseSection.vue` |
| `decision` | `case-section type=decision` | `CaseSection.vue` |
| `result` | `case-section type=result` | `CaseSection.vue` |
| `metric` | `metric-card` | `MetricCard.vue` |
| `tool-stack` | `tool-stack` | `ToolStack.vue` |
| `quote` | `quote-block` | `QuoteBlock.vue` |
| `case-gallery-start/item/end` | `case-gallery` | `CaseGallery.vue` |
| `related-works` | `related-works` | `PortfolioRelatedWorks.vue` |

## Tone rule

The components intentionally reuse the existing VarunTools surface language:

- `var(--vt-surface-strong)`, `var(--vt-hair)`, `var(--vt-shadow-1)`
- rounded paper-like panels instead of loud dashboard cards
- small uppercase kickers for structure
- chip metadata with restrained density
- mobile-first single-column fallback

## Contract

A CSV portfolio block should render as a dedicated directive, not as a generic `markdown-box`, unless the block itself is the legacy `box` block.

Generated portfolio Markdown should not contain `[object Object]`, and array props should be serialized into JSON data attributes such as `role-json` or `stack-json`.

## Related works resolution

`related-works` is rendered by `PortfolioRelatedWorks.vue`. The component resolves items through the Works/page registry and filters out missing, private, and draft entries. Authoring diagnostics are produced by `scripts/lib/portfolio-link-guard.mjs` so broken links are caught before they appear in the UI.

## Commit 99 accessibility polish

Portfolio render components now carry a small accessibility contract:

- `PortfolioHero` computes a stable image alt fallback.
- `CaseGallery` buttons expose `aria-label` and caption `aria-describedby`.
- Missing gallery media uses a disabled state instead of looking clickable.
- `MetricCard` keeps static values and does not add animated counters.
- Responsive CSS keeps detail components readable at narrow widths.

## Authoring reference

For how CSV blocks become these render components in a full page workflow, see `docs/authoring/portfolio-authoring-v2.md`.
