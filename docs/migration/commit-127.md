# Commit 127 Migration Notes

## Commit

```txt
chore(content): add page inventory and visibility audit
```

## Baseline

Commit 126 polished featured portfolio copy and editorial rhythm. Commit 127 does not change the editorial components, inquiry system, admin workers, or routing logic.

## Added

```txt
scripts/generate-content-page-inventory.mjs
scripts/smoke-content-page-inventory.mjs
generated/page-inventory.json
generated/page-inventory.md
docs/authoring/content-page-inventory.md
BAKE_REPORT_COMMIT_127.md
```

## Behavior

The generator scans `src/content/pages/**/index.md`, derives route paths from source paths, reads frontmatter metadata, and writes an inventory JSON plus a Markdown audit report.

It surfaces:

```txt
public pages
hidden/private/draft pages
noindex pages
featured pages
warnings
errors
```

## Warnings are not automatic fixes

Commit 127 intentionally does not rewrite slugs or visibility. For example, `ROUTE_SLUG_MISMATCH` is a warning so the next commit can decide whether the mismatch is intentional.

## Error boundary

Errors are reserved for contract violations that should not ship:

```txt
hidden/private/draft page marked featured
object serialization leak source leaks
frontmatter parse failures
```

## Excluded

```txt
route rewrites
navigation redesign
sitemap generator rewrite
search index rewrite
portfolio editorial component changes
inquiry system changes
admin/Worker/D1 changes
```

## Follow-up candidates

```txt
feat(navigation): add structured page index and section navigation
test(content): harden sitemap and search index visibility rules
content(portfolio): expand editorial rhythm to project detail pages
```
