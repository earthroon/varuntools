# Commit 11 - Work Detail / Related Works Metadata

## Purpose

Commit 11 adds metadata-driven related work surfaces to Markdown-backed detail pages.

The detail footer is based on Markdown frontmatter, not DOM inference.

## Scope

- Add `date`, `updated`, `series`, `related`, and `visibility` to frontmatter types.
- Extend `pageRegistry.ts` with work detail context helpers.
- Add `WorkMetaChips.vue`.
- Add `RelatedWorks.vue`.
- Add `WorkPager.vue`.
- Add `WorkDetailFooter.vue`.
- Connect the footer to Markdown-backed detail pages.
- Add `markdown-related.css`.

## Related work order

1. Explicit `related` slugs.
2. Same `series`.
3. Shared tags.
4. Same kind.
5. Nearby order.

The current page, `archived` pages, and `hidden` pages are excluded.

## Not included

- Graph visualization.
- Search engine ranking.
- Legacy Notion page-link adapters.
- Lightbox, Tooltip, or VENOM NAV ports.
- External CMS integration.

## Completion criteria

- Detail footer renders for eligible detail pages.
- Explicit related slugs are preferred.
- Related fallback uses series, tags, kind, and order.
- Previous/next links are order-based.
- `archived` and `hidden` pages are excluded.
- Mobile layout collapses to one column.
