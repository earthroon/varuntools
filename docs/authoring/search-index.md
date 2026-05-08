# Search Index Authoring

Commit 55 adds the static search-index foundation for VARUNTOOLS.

## Commands

```bash
npm run generate:search-index
npm run smoke:search-index
```

## Output

```txt
public/search-index.json
```

The file is committed as a static asset so GitHub Pages can serve it without a server runtime.

## Included pages

Included:

```txt
visibility != hidden
status != archived
frontmatter.draft != true
product.status != draft
product.status != hidden
```

Excluded:

```txt
policies/* hidden pages
archived pages
draft pages
hidden products
draft products
```

## Indexed fields

The index stores navigation metadata only:

```txt
title
description / summary
tags
kind
status
thumbnail
product.type
product.status
product.series
product.collection
```

Full markdown body text is intentionally excluded in Commit 55. The index is a command-palette foundation, not a full-text search engine.

## Command Palette UI

Commit 56 connects the static index to a global command palette.

```txt
Keyboard: Ctrl+K / Command+K
Close: Escape or backdrop click
Move: ArrowUp / ArrowDown
Open selected result: Enter
```

Runtime flow:

```txt
src/components/CommandPalette.vue
└─ fetch(import.meta.env.BASE_URL + 'search-index.json')
   └─ src/search/commandPalette.ts
      └─ searchCommandPaletteEntries()
```

The palette is mounted once in `src/App.vue`, so it is available on Markdown pages, product pages, works pages, and the home page.

## Product taxonomy in search index

Commit 63 adds `product.category`, `product.subcategory`, `product.collection`, and `product.series` to `public/search-index.json`.
