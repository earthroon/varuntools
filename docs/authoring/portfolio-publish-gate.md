# Portfolio Publish Gate

Commit 107 adds a publish quality gate for portfolio work pages.

## SSOT

The gate reads existing authoring/runtime artifacts; it does not create or fix content.

- Authoring source: `page.csv` and generated `index.md` frontmatter
- Work metadata: `frontmatter.work` and legacy work frontmatter fields
- Asset evidence: `src/content/generated/portfolio-asset-manifest.json`
- SEO evidence: `src/content/generated/portfolio-seo-manifest.json`
- Tag evidence: `src/content/generated/portfolio-tag-index.json`
- Search evidence: `src/content/generated/page-search-index.json`

The generated report is derived output:

```txt
src/content/generated/portfolio-publish-report.json
```

Do not edit the report by hand.

## Commands

```bash
npm run check:publish
npm run check:publish -- --include-draft
npm run check:publish -- --strict-warnings
npm run check:publish -- --work works/varuntools-showroom
npm run smoke:portfolio-publish-gate
```

## Default targets

By default the gate checks published, archived, and active work pages.

Draft/private/hidden pages are excluded unless `--include-draft` is passed.

## Levels

### Error

Errors block publication.

- `PUBLISH_MISSING_TITLE`
- `PUBLISH_MISSING_SUMMARY`
- `PUBLISH_MISSING_WORK_TYPE`
- `PUBLISH_INVALID_STATUS`
- `PUBLISH_MISSING_COVER`
- `PUBLISH_COVER_NOT_FOUND`
- `PUBLISH_RELATED_WORK_NOT_FOUND`
- `PUBLISH_RELATED_WORK_PRIVATE`
- `PUBLISH_ASSET_MISSING`
- `PUBLISH_SEO_CANONICAL_INVALID`
- `PUBLISH_PRIVATE_INDEXED`
- `PUBLISH_DRAFT_INDEXED`

### Warning

Warnings do not block publication unless `--strict-warnings` is used.

- `PUBLISH_MISSING_THUMB`
- `PUBLISH_MISSING_ALT`
- `PUBLISH_MISSING_TAGS`
- `PUBLISH_LOW_SUMMARY_LENGTH`
- `PUBLISH_MISSING_RELATED_WORKS`
- `PUBLISH_MISSING_METRIC`
- `PUBLISH_LARGE_COVER_IMAGE`
- `PUBLISH_SEO_MISSING_IMAGE`
- `PUBLISH_SEARCH_TEXT_TOO_SHORT`

### Info

Info diagnostics are contextual signals.

- `PUBLISH_ARCHIVED_WORK`
- `PUBLISH_FEATURED_WORK`
- `PUBLISH_TAG_COUNT`
- `PUBLISH_RELATED_COUNT`

## Contract

The gate never invents missing data.

If a work has no cover, the gate reports `PUBLISH_MISSING_COVER`. It does not generate a cover.

If a work has no summary, the gate reports `PUBLISH_MISSING_SUMMARY`. It does not write a summary.

If a related work points to a missing/private page, the gate reports it. It does not rewrite the relation.

## Recommended release sequence

```bash
npm run csv:pages
npm run build:portfolio-assets
npm run build:page-search
npm run build:portfolio-tags
npm run build:portfolio-seo
npm run check:publish
npm run smoke:portfolio-publish-gate
```
