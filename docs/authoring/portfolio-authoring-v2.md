# Portfolio Authoring Guide v2

This guide is the authoring SSOT for the VarunTools portfolio CSV workflow.

The important rule is simple:

```txt
page.csv is the authoring SSOT.
index.md is generated output.
```

Do not hand-edit generated `index.md` for CSV-authored portfolio pages. Edit `page.csv`, then regenerate Markdown through the CSV pipeline.

## 1. Authoring flow

```txt
new-page preset
→ page.csv 작성
→ placeholder asset 교체
→ npm run csv:pages
→ preview / diff / check / report
→ asset guard 확인
→ related-works 확인
→ work.status draft → published 변경
→ featured / weight 의도 확인
→ Works / detail / home featured 반영 확인
```

Minimal flow:

```bash
npm run new:page -- works my-case --csv --type case-study
npm run csv:pages
npm run smoke:portfolio-presets
```

Dependency-backed launch flow:

```bash
npm ci
npm run check:deps
npm run validate:content
npm run check:launch
```

If dependency runtime is not installed, `check:launch` should stop at `check:deps`. That is an environment readiness failure, not a content authoring failure.

## 2. Create a new portfolio page

Commit 100 added authoring presets.

```bash
npm run new:page -- works my-case --csv --type case-study
npm run new:page -- works my-tool --csv --type tool --title "My Tool"
npm run new:page -- works my-visual --csv --type visual
npm run new:page -- works my-service --csv --type service
npm run new:page -- works my-experiment --csv --type experiment
```

Generated structure:

```txt
src/content/pages/works/my-case/
  page.csv
  index.md
  cover.svg
  thumb.svg
  images/.gitkeep
  videos/.gitkeep
  README.md
```

Defaults are intentionally safe:

```txt
work.status=draft
work.featured=false
work.weight=50
```

Existing `page.csv` is protected. It is not overwritten, even with `--force`, because it is the page authoring SSOT.

## 3. `page.csv` columns

```txt
block,title,body,src,alt,caption,thumb,layout,kind,options,meta
```

| Column | Meaning |
| --- | --- |
| `block` | Which page/render block this row produces. |
| `title` | Block title or label. |
| `body` | Main body copy. |
| `src` | Primary asset path. |
| `alt` | Image alternative text. |
| `caption` | Image or block caption. |
| `thumb` | Thumbnail asset path. |
| `layout` | Layout hint. |
| `kind` | Semantic/tone hint. |
| `options` | Structured options v2. |
| `meta` | Reserved extra metadata. |

When an options value contains commas, wrap the whole CSV cell in quotes:

```csv
related-works,관련 작업,,,,,,,,"items=[csv-authoring, varuntools-store]",
```

## 4. `frontmatter.work`

Portfolio metadata is generated from `work.*` options on the `page` row.

Common fields:

```txt
work.type
work.status
work.featured
work.weight
work.year
work.period
work.role
work.stack
work.tools
work.tags
work.summary
work.links.demo
work.links.repo
```

Example:

```csv
page,My Case,Short summary,./cover.svg,Case cover,Hero caption,./thumb.svg,,,"work.type=case-study; work.status=draft; work.featured=false; work.weight=50; work.role=[Design Engineer]; work.stack=[Vue, TypeScript]; work.tags=[portfolio, csv]",
```

Status policy:

| Status | Behavior |
| --- | --- |
| `draft` | Writing state. Hidden from home/featured surfaces. |
| `private` | Private state. Hidden from Works, home, and related works. |
| `published` | Public state. Can appear in Works/detail/home. |
| `archived` | Historical work. Can be shown with archived status. |

Home featured rule:

```txt
work.featured=true
hasWorkMetadata=true
work.status !== private
work.status !== draft
```

Sort rule:

```txt
featured desc
weight desc
year desc
order asc
title asc
```

## 5. Portfolio blocks

Portfolio CSV blocks map into dedicated Markdown directives and Vue render components.

| CSV block | Render result |
| --- | --- |
| `portfolio-hero` | `PortfolioHero` |
| `work-summary` | `WorkSummary` |
| `role-stack` | `RoleStack` |
| `problem` | `CaseSection type=problem` |
| `solution` | `CaseSection type=solution` |
| `process` | `CaseSection type=process` |
| `decision` | `CaseSection type=decision` |
| `result` | `CaseSection type=result` |
| `metric` | `MetricCard` |
| `tool-stack` | `ToolStack` |
| `quote` | `QuoteBlock` |
| `case-gallery-start/item/end` | `CaseGallery` |
| `related-works` | `PortfolioRelatedWorks` |

Core narrative order for case studies:

```txt
portfolio-hero
work-summary
role-stack
problem
decision
solution
process
result
metric
tool-stack
case-gallery
related-works
```

## 6. Options v2 syntax

Basic key/value:

```txt
key=value
```

Array:

```txt
stack=[Vue, TypeScript, Cloudflare Workers]
role=[Design Engineer, Frontend]
tags=[portfolio, csv, tool]
```

Quoted string:

```txt
summary="쉼표, 세미콜론이 들어가는 문장"
```

Boolean:

```txt
featured=true
readyForCatalog=false
```

Number:

```txt
weight=90
year=2026
```

Nested key:

```txt
mood.tone=almond-paper
work.links.demo=/demo
work.links.repo=https://example.com/repo
```

## 7. Asset guard rules

Local assets are preferred.

Allowed examples:

```txt
./cover.webp
./images/mockup.svg
/assets/cover.webp
```

Blocked examples:

```txt
javascript:
data:
file:
blob:
../../outside-project.webp
```

Rules:

- `src` and `thumb` must point to existing files when required.
- Images should include `alt`.
- Gallery images should include captions.
- Placeholder `cover.svg` and `thumb.svg` are scaffold assets only; replace them before publishing.

## 8. `related-works` rules

Use `related-works` for internal portfolio relationships only.

Accepted item formats:

```txt
slug
/works/slug
works/slug
```

Rejected item format:

```txt
https://example.com
```

External URLs belong in explicit link fields such as:

```txt
work.links.demo
work.links.repo
```

The link guard checks:

```txt
missing slug
self reference
duplicate slug
private target
draft target
archived target
external URL
direct two-way cycle
```

## 9. Home featured rules

A page appears in home featured works only when:

```txt
work.featured=true
hasWorkMetadata=true
work.status !== draft
work.status !== private
```

A root-level `featured` value without `frontmatter.work` is not enough. This prevents product/store metadata from leaking into portfolio featured slots.

## 10. Preview / diff / check / report

Single-page commands:

```bash
npm run csv:page -- path/to/page.csv --preview
npm run csv:page -- path/to/page.csv --diff
npm run csv:page -- path/to/page.csv --check
npm run csv:page -- path/to/page.csv --report
```

All CSV-authored pages:

```bash
npm run csv:pages
```

Report output includes:

```txt
diagnostics
asset summary
portfolio links summary
generated markdown path
```

## 11. Fixtures

Fixture root:

```txt
src/content/templates/csv-fixtures/
```

Fixtures are contracts, not decoration. When adding a CSV block, option, preset, or validation rule, add a fixture or smoke that proves the intended behavior.

Useful command:

```bash
npm run smoke:csv-fixtures
```

## 12. Publish checklist

Before changing a portfolio page from `draft` to `published`:

```txt
[ ] page.csv is the authoring SSOT
[ ] index.md was not hand-edited
[ ] work.status is intentional
[ ] work.featured is intentional
[ ] work.weight is intentional
[ ] cover/thumb placeholder assets were replaced
[ ] image alt text is written
[ ] gallery captions are written
[ ] related-works slugs are valid
[ ] npm run csv:pages passes
[ ] npm run smoke:portfolio-presets passes
[ ] npm run smoke:portfolio-accessibility passes
[ ] npm run smoke:home-featured-works passes
[ ] dependency-backed npm run check:launch passes before release
```

## 13. Common failures

### `gray-matter` missing

Cause:

```txt
root node_modules is not installed
```

Fix:

```bash
npm ci
npm run check:deps
```

### Asset missing

Cause:

```txt
CSV src/thumb points to a file that does not exist
```

Fix:

```txt
Create the file or correct the path.
```

### Related work not found

Cause:

```txt
related-works items includes a slug that is not a known portfolio page
```

Fix:

```txt
Use an existing Works slug, remove the item, or publish the target page first.
```

### Page not visible on home

Check:

```txt
work.featured=true
hasWorkMetadata=true
work.status is not draft/private
```

### Generated Markdown overwritten edits

Cause:

```txt
index.md was edited directly, then regenerated from page.csv
```

Fix:

```txt
Move the intended edit back into page.csv and regenerate.
```

## 14. Case-study quick example

```bash
npm run new:page -- works my-case --csv --type case-study --title "My Case"
```

Edit:

```txt
src/content/pages/works/my-case/page.csv
```

Then run:

```bash
npm run csv:pages
npm run smoke:portfolio-presets
```

Publish only after replacing placeholder assets and setting:

```txt
work.status=published
```

## 15. Tool quick example

```bash
npm run new:page -- works my-tool --csv --type tool --title "My Tool"
```

Keep `tool-stack` specific:

```txt
stack=[Vue, TypeScript]
tools=[Vite, Cloudflare Workers]
runtime=[Browser, Worker]
storage=[R2, D1]
```

Then verify:

```bash
npm run csv:pages
npm run smoke:portfolio-render-components
npm run smoke:works-collection
```

## Reference docs

- `docs/authoring/portfolio-presets.md`
- `docs/authoring/portfolio-frontmatter.md`
- `docs/authoring/portfolio-render-components.md`
- `docs/authoring/portfolio-links.md`
- `docs/authoring/csv-asset-guard.md`
- `docs/authoring/csv-fixtures.md`
- `docs/authoring/launch-validation.md`

## Portfolio search and facets

The Works page has local search powered by `frontmatter.work` and the normalized Works collection. Search does not use a manually maintained JSON file.

Search covers title, summary, role, stack, tools, tags, type, year, period, client, category, and slug. Facets are generated for type, tags, stack, role, and year with result counts.

Filtering uses AND semantics: query plus selected type/tag/stack/role/year must all match. Draft and private works are excluded by the existing Works collection visibility policy.

Reference: `docs/authoring/portfolio-search.md`.

## Commit 103 media checklist

After replacing placeholder media, rebuild the portfolio asset manifest:

```bash
npm run build:portfolio-assets
npm run smoke:portfolio-asset-manifest
```

Before publishing, check:

- hero cover is intentional and not oversized
- gallery images are lazy-loaded
- missing count is zero unless explicitly accepted
- large asset warnings are reviewed
- `src/content/generated/portfolio-asset-manifest.json` is generated from current CSV content

## SEO / Sitemap build

Portfolio SEO artifacts are generated from frontmatter, `frontmatter.work`, and the portfolio asset manifest.

```bash
npm run build:portfolio-assets
npm run build:portfolio-seo
npm run smoke:portfolio-seo
```

Generated files:

```txt
src/content/generated/portfolio-seo-manifest.json
public/sitemap.xml
public/robots.txt
```

Do not hand-edit generated SEO files as source. Fix the page frontmatter, `page.csv`, or asset references, then rebuild.

Publishing checklist additions:

```txt
[ ] npm run build:portfolio-seo
[ ] npm run smoke:portfolio-seo
[ ] sitemap.xml exists
[ ] robots.txt includes Sitemap
[ ] draft/private pages are absent from sitemap
[ ] canonical URLs use https://varun.tools or the intended SITE_ORIGIN
```

## Site page search

Commit 105 adds a site-wide local search route:

```bash
npm run build:page-search
npm run smoke:page-search
```

The generated search index lives at:

```txt
src/content/generated/page-search-index.json
```

This file is derived from frontmatter, Markdown body excerpts, work metadata, and SEO indexability policy. Do not edit it manually.

Use `/search?q=...` for site-wide search. Use `/works?q=...` for Works-only portfolio filtering.

## Tag landing pages

Portfolio tag landing pages are generated from work metadata.

```bash
npm run build:portfolio-tags
npm run smoke:portfolio-tags
npm run build:portfolio-seo
npm run smoke:portfolio-seo
```

Generated tag pages use this route shape:

```txt
/works/tags/:tag
```

The generated tag index is not the authoring SSOT. Update `page.csv` / frontmatter work metadata, then regenerate the tag index. Draft, private, hidden, and empty tag pages are excluded from tag landing pages and sitemap output.

## Commit 107 — Publish quality gate

Before changing a work to a public status, refresh generated artifacts and run the publish gate:

```bash
npm run csv:pages
npm run build:portfolio-assets
npm run build:page-search
npm run build:portfolio-tags
npm run build:portfolio-seo
npm run check:publish
```

The gate writes `src/content/generated/portfolio-publish-report.json` and reports errors, warnings, and info diagnostics. Errors block publication. Warnings are visible but allowed unless `--strict-warnings` is used.

The gate does not fix missing content. It reports missing title, summary, cover, broken related works, missing assets, invalid canonical URLs, and indexability mismatches.

## Lazy WebGPU EWA gallery refinement

Gallery images can be refined at runtime when a user opens the lightbox. This is not a global image optimization pass.

```txt
page load: no WebGPU initialization
lightbox open: process active image only
close: clear runtime result/cache
```

Use this for downscale ringing/ghost mitigation in opened gallery images. The original image and asset manifest remain the SSOT. Runtime WebGPU output is disposable.

Verification:

```bash
npm run smoke:ewa-gallery-processor
```


## EWA visual QA

For gallery image QA, see `docs/authoring/ewa-visual-qa.md`. Debug mode is opt-in and only observes the active lightbox image.

## EWA gallery image hints

For gallery rows, use `media.*` options when an image needs a specific runtime EWA treatment in the lightbox:

```csv
case-gallery-item,Admin UI,관리자 화면,./images/admin.png,관리자 UI,캡션,,,,media.ewaPreset=ui-low-ring;media.ewaMode=adaptive-tile,
```

See `docs/authoring/ewa-image-metadata.md` for the full contract.
