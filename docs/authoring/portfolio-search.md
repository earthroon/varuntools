# Portfolio Search

Commit 102 adds local portfolio search and facet indexes for the Works page.

## SSOT

Search uses the normalized Works collection. It does not introduce a new manual JSON index.

```txt
frontmatter.work -> pageRegistry -> getWorkCollectionEntries() -> local search/facet index
```

## Search fields

The local search text is derived from:

- title
- description
- summary
- type / kind
- slug
- role
- stack
- tools
- tags
- year
- period
- client
- category
- series

Search is case-insensitive and keeps Korean text intact through `NFKC` normalization.

## Facets

The search panel builds count-based facets from visible work entries:

- type
- tags
- stack
- role
- year

Each facet option has this shape:

```ts
type PortfolioFacetItem = {
  value: string
  count: number
}
```

## Filter behavior

Filters use AND semantics:

```txt
query match
AND selected type
AND selected tag
AND selected stack
AND selected role
AND selected year
AND featured-only when enabled
```

Within Commit 102, each facet group remains single-select. Multi-select OR behavior is intentionally left out.

## Visibility

The search consumes `getWorkCollectionEntries()`, so draft/private items are excluded by the existing Works collection visibility policy.

## URL query sync

The existing Works page already syncs `q`, `type`, `role`, `stack`, `tag`, `year`, `featured`, and `sort` into the URL query. Commit 102 keeps that behavior and routes it through the new search/facet utilities rather than creating another state source.

## Empty state

The Works grid still owns the empty state:

```txt
표시할 작업이 없습니다.
검색어나 필터를 줄여보세요.
```

The search panel only reports the current result count.

## Site-wide page search boundary

Commit 102 covers Works/portfolio collection search. Commit 105 adds a separate site-wide page search.

```txt
/works?q=vue   -> portfolio works search
/search?q=vue  -> site-wide page search
```

The two systems share the local-search philosophy, but they do not share state ownership.

## Difference from tag landing pages

Portfolio search and tag landing pages are related, but not the same state.

```txt
/works?q=vue       -> temporary Works search/filter state
/search?q=vue      -> site-wide page search
/works/tags/vue    -> shareable tag landing page
```

Tag landing pages are generated from work metadata and can be included in the sitemap. Search query URLs are not sitemap entries.
