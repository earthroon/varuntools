# Portfolio Links Guard

Commit 96 validates internal portfolio relationships before they become broken UI.

## Related works input

CSV pages can declare related portfolio pages with the `related-works` block:

```csv
related-works,관련 작업,,,,,,,,items=[csv-authoring, varuntools-store],
```

The accepted item forms are `slug`, `/works/slug`, and `works/slug`. External URLs are not valid `related-works` items. Use `work.links.demo`, `work.links.repo`, or another explicit link field for external destinations.

## Validation rules

| Case | Loose mode | Strict mode |
| --- | --- | --- |
| Missing slug | warning | error |
| Self reference | warning | error |
| Duplicate slug | warning | warning |
| Private target | error | error |
| Draft target | warning | error |
| Archived target | warning | warning |
| External URL item | error | error |
| Direct two-way cycle | warning | warning |

Runtime rendering resolves visible Works entries and does not render missing strings as fallback links.

## SSOT

- Link existence: `pageRegistry`
- Link visibility: `frontmatter.work.status`
- Authoring validation: `scripts/lib/portfolio-link-guard.mjs`
- Runtime rendering: `PortfolioRelatedWorks.vue`

## Authoring reference

For where related works sit inside the full portfolio publishing flow, see `docs/authoring/portfolio-authoring-v2.md`.
