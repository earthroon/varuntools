# Home Featured Works

Commit 97 connects homepage featured work cards to `frontmatter.work`.

## SSOT

Homepage featured works are selected from the same normalized Works collection used by `/works`.

```yaml
work:
  featured: true
  weight: 90
  status: published
  summary: 대표 작업 카드용 요약
```

## Selection rules

- `work.featured: true` is required.
- Pages without `frontmatter.work` are not eligible, even if older root `featured` metadata exists.
- `work.status: private` is hidden.
- `work.status: draft` is hidden.
- `work.status: archived` can appear if it is explicitly featured.

## Sorting

The section reuses the Works collection ordering:

1. `featured` first
2. `weight` descending
3. `year` descending
4. `order` ascending
5. title ascending

## Display

The home section uses existing WorkCard rendering and the existing `var(--vt-*)` design tokens. It is intentionally compact: title, summary, cover, type, year/period, role chips, stack chips, and the view-all link to `/works`.

## Empty state

If there are no eligible featured works, the section does not render. The homepage must not show a broken empty block.
