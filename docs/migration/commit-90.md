# Commit 90 — Portfolio frontmatter contract v2

## Commit

```txt
feat(content): add portfolio frontmatter contract v2
```

## Summary

Commit 90 adds `frontmatter.work` to generated CSV pages. This object is the SSOT for portfolio collection metadata such as role, stack, tags, featured state, weight, mood, and links.

## Authoring policy

Preferred authoring uses `work.*` options on the `page` row.

Fallback priority:

```txt
page.options.work.* > page legacy work-like options > portfolio-hero fallback > no work object
```

This keeps product pages stable and prevents accidental `work` metadata from root `tags` or `featured` options.

## Validation

`validate-content` now knows about `frontmatter.work` and warns on invalid work object shapes, invalid `work.type`, invalid `work.status`, and incorrect primitive types.

## Verification

```bash
npm run smoke:portfolio-frontmatter
npm run smoke:csv-portfolio-blocks
npm run smoke:csv-options
npm run smoke:csv-diagnostics
npm run smoke:csv-authoring
npm run csv:pages
```
