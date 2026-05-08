# Commit 92 Migration — Works Collection Filters and Cards

```txt
commit: feat(works): enhance portfolio collection filters and cards
```

## What changed

Commit 92 connects `frontmatter.work` to the `/works` collection UI.

The works index now normalizes portfolio metadata into `WorkCardEntry`, then uses that normalized data for filtering, sorting, and card display.

## New collection fields

- `work.type`
- `work.status`
- `work.featured`
- `work.weight`
- `work.year`
- `work.period`
- `work.role`
- `work.stack`
- `work.tools`
- `work.tags`
- `work.category`
- `work.summary`

## Safety policy

`frontmatter.work` is the SSOT for portfolio collection metadata. Body Markdown is not scraped for collection state.

`private` and `draft` work items are hidden from the default collection.

## Verification

```bash
npm run smoke:works-collection
npm run smoke:portfolio-frontmatter
npm run csv:pages
```
