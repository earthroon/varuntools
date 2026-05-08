# Commit 20 Migration Notes

## Old Super/Notion pattern

Super/Notion callouts could contain page links and the runtime body script converted those links into a pagecard grid after the DOM mounted.

## New Markdown SSOT

Use an explicit Markdown directive:

```md
::pagecard-grid
items:
  - /tools/wiper
  - /lab/markdown-gallery
::
```

Or use a registry-backed query:

```md
::pagecard-grid
query: tools
limit: 6
sort: order
::
```

## Legacy markers

The source transform adapter can absorb these limited migration inputs:

```md
> [[/tools/wiper]]
> [[/lab/markdown-gallery]]
```

```md
> [!pagecards]
> /tools/wiper
> /lab/markdown-gallery
```

```md
[pagecards]
- /tools/wiper
- /lab/markdown-gallery
```

## Boundary

Do not restore a `.notion-callout` DOM scanner. Pagecard grids are resolved from Markdown directives and content registry metadata.
