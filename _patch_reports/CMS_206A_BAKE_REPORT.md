# BAKE REPORT — CMS-206A

## Patch

`CMS-206A`  
`Public Exposure Taxonomy Contract / Category Kind Surface Visibility Indexing Separation / No Orphan Published Markdown No Homepage Silent Miss`

## SSOT

- `category` is the CMS authoring/management classification.
- `kind` is the public renderer/card/list classification.
- `visibility` controls public route eligibility.
- `status` controls lifecycle eligibility.
- `exposure` controls route, home, collection, search, sitemap, nav, and featured surfaces.
- `indexing` is separate from route publication.

## Applied Files

### VACMS

- `workers/admin-api/src/contentExposureTaxonomy.ts`
- `scripts/cms206a-public-exposure-taxonomy-contract-smoke.mjs`
- `scripts/cms206a-publish-export-exposure-smoke.mjs`
- `scripts/cms206a-no-orphan-published-markdown-smoke.mjs`
- `artifacts/cms/CMS_206A_PUBLIC_EXPOSURE_TAXONOMY_CONTRACT.json`

Patched by apply script:

- `admin/src/schema-packs/contentSchemaPacks.ts`
- `workers/admin-api/src/contentSchemaPacks.ts`
- `workers/admin-api/src/contentPublishBridge.ts`
- `package.json`

### VarunTools

- `src/content/exposureTaxonomy.ts`
- `scripts/generate-content-page-inventory.mjs`
- `scripts/cms206a-public-exposure-taxonomy-smoke.mjs`
- `scripts/cms206a-post-section-classification-smoke.mjs`
- `scripts/cms206a-homepage-surface-resolution-smoke.mjs`
- `scripts/cms206a-no-orphan-published-markdown-smoke.mjs`
- `scripts/cms206a-search-sitemap-indexing-policy-smoke.mjs`
- `artifacts/cms/CMS_206A_PUBLIC_EXPOSURE_TAXONOMY_CONTRACT.json`

Patched by apply script:

- `src/types/generatedContent.ts`
- `src/components/markdown/HomeSection.vue`
- `src/content/pagecardResolver.ts`
- `src/markdown/pageRegistry.ts`
- `src/content/pages/home/index.md`
- `package.json`

## Smoke Markers

```txt
PASS_CMS206A_SCHEMA_PACK_EXPOSURE_DEFAULTS
PASS_CMS206A_PUBLISH_EXPORT_EXPOSURE_CONTRACT
PASS_CMS206A_NO_ORPHAN_PUBLISHED_MARKDOWN_GATE
PASS_CMS206A_PUBLIC_EXPOSURE_TAXONOMY
PASS_CMS206A_POST_SECTION_CLASSIFICATION
PASS_CMS206A_HOMEPAGE_SURFACE_RESOLUTION
PASS_CMS206A_NO_ORPHAN_PUBLISHED_MARKDOWN
PASS_CMS206A_SEARCH_SITEMAP_INDEXING_POLICY
```

## Build Status

Not run in this sandbox because full repositories and dependencies are not present. This bake provides local apply scripts and smoke gates for the user's local repositories.

## Next Patch

`CMS-206B Public Page Asset Bundle Materialization / Markdown And Page-Scoped Assets Commit To Public Content Tree / No Markdown-Only Publish No R2-Only Asset Reference`
