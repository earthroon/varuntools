# Portfolio Editorial Blocks

Commit 121 adds editorial heading and column blocks for portfolio content.

## Existing Markdown headings remain valid

Do not replace every heading with a directive. Normal `#`, `##`, and `###` headings remain the ordinary writing flow.

## editorial-title

```md
::editorial-title
level: major
as: h2
kicker: PROJECT
title: DreamColor
subtitle: 감정 기반 색채 조율 도구
::
```

Levels:

- `major`: section entry point
- `middle`: section turn
- `minor`: compact detail heading

Accessibility rule: visual level and semantic heading tag are separate. Use `as` to preserve document order.

## editorial-columns

```md
::editorial-columns
cols: 2
gap: md
collapse: mobile
::
### 문제

...

---
### 해결

...
::
```

`cols` supports `2` and `3`. Columns collapse on mobile unless `collapse: never` is used.
