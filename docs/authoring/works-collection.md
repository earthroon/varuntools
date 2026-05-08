# Works Collection Metadata Contract

Commit 92 makes the `/works` collection read portfolio metadata from `frontmatter.work`.

## SSOT

```txt
Works collection SSOT = frontmatter.work
```

The collection UI should not scrape Markdown body content to infer role, stack, type, tags, featured state, or sorting weight.

## Consumed fields

```yaml
work:
  type: case-study
  status: published
  featured: true
  weight: 90
  year: 2026
  period: 2026
  client: internal
  role:
    - Design Engineer
    - Frontend
  stack:
    - Vue
    - TypeScript
  tools:
    - Cloudflare Workers
  tags:
    - store
    - portfolio
  category: system
  summary: 카드에 표시할 짧은 설명
  mood:
    tone: almond-paper
    density: high
```

## Visibility policy

- `work.status: private` is always hidden from the collection.
- `work.status: draft` is hidden by default.
- `work.status: archived` may be shown with an archived badge.
- Missing `work.status` falls back to `published` unless the page itself is draft/archived.

## Default sorting

```txt
featured desc
weight desc
year desc
order asc
title asc
```

## Filters

Commit 92 exposes these filters:

- type
- role
- stack
- tag
- year
- featured only
- query search

Filter options are generated from normalized work entries, deduplicated, and sorted by frequency first.

## Card display

Work cards display:

- thumbnail or cover
- type badge
- featured badge
- period or year
- title
- summary
- role chips
- stack chips
- tags

Chip counts are intentionally capped so cards do not become tag bins.
