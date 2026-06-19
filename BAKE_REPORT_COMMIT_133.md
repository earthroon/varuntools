# BAKE REPORT COMMIT 133 — Page Search Public Visibility Seal

## Patch identity

- Patch: CMS_D1_017A_R2Z_R1W_R4_LIVE_R2_F6_F30
- Target commit seal: Commit 133
- Scope: public page search visibility report reseal

## Smoke contract

This report seals the public page search visibility gate for:

- `smoke:page-search-public-visibility`
- `search:generate-public-index`
- `scripts/generate-page-search-index.mjs`
- `scripts/lib/page-search-index.mjs`
- `src/content/generated/page-search-index.json`

## Visibility contract

Public page search output must include public active searchable routes such as:

- `/`
- `/works`
- `/works/varuntools-showroom`
- `/products`

Public page search output must exclude internal or non-public surfaces:

- `docs/authoring`
- `docs/migration`
- `BAKE_REPORT`
- `/works/editorial-showcase`
- `/products/dummy-catalog`
- `/products/spec-playground`
- `/checkout/success`
- `/checkout/fail`
- `/qa/ewa-gallery`
- `/claim`
- `/inquiry`

## Boundary

- No runtime source mutation is included in this reseal.
- No route adoption is included.
- No sitemap or robots generation logic is changed.
- No public navigation change is included.

## Operator validation

Run:

```bash
npm run check:launch
```

Expected gate:

```text
[smoke:page-search-public-visibility] OK
```
