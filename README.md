# VARUNTOOLS Commit 18 — Markdown Caption Tooltip / Chip Native Port

This package is a Vite + Vue + TypeScript scaffold for VARUNTOOLS with an extended Markdown renderer.

## Current baked scope

- Vite + Vue + TypeScript
- Markdown content SSOT under `src/content/pages/**/index.md`
- `markdown-it` + `gray-matter` rendering pipeline
- Extended Markdown directives
- Vue mount bridge for Markdown custom elements
- Showroom theme tokens and component surfaces
- Media asset hardening
- Markdown TOC foundation
- Section layout directives and `[문단끝]` legacy adapter
- Markdown card / featured works foundation
- `/works` collection page with query/kind/tag/sort controls
- Work detail footer with related works and previous/next navigation
- Shared Markdown document renderer via `MarkdownDocumentView.vue`
- Router / slug resolution cleanup
- GitHub Pages deploy hardening with `gh-pages` branch dist commit workflow
- SPA fallback generation through `dist/404.html`
- Runtime page meta, SEO, OG image, canonical, and robots handling
- Markdown image title caption tooltip / chip native port
- `::captioned-image` directive with asset validation
- Static search index and Command Palette UI (`Ctrl/Command + K`)

## Commands

```bash
npm install
npm run dev
npm run build
npm run build:pages
```

## Commit 14 note

VARUNTOOLS GitHub Pages deployment is now prepared through a local `gh-pages` branch dist commit workflow.

Deploy workflow:

```txt
npm run release:pages -- --push
```

Custom domain SSOT:

```txt
public/CNAME -> varun.tools
```

Vite base:

```txt
base: '/'
```

SPA fallback:

```txt
npm run build:pages
└─ vite build
└─ scripts/create-spa-fallback.mjs
   └─ dist/index.html -> dist/404.html
```

GitHub repository Settings → Pages must use `Deploy from a branch`, branch `gh-pages`, folder `/ root`. Custom domain is fixed to `varun.tools`; see `docs/deploy/github-pages.md`.

## Deferred legacy paths

The old Super/Notion DOM parser path remains intentionally deferred:

- VENOM NAV
- Lightbox
- Legacy Pagecard Grid
- Legacy Featured Works DOM parser
- Super/Notion runtime observer


## Build verification

Commit 18 verified with direct build gate commands:

```bash
node scripts/validate-content.mjs
./node_modules/.bin/vue-tsc --noEmit
./node_modules/.bin/vite build
node scripts/create-spa-fallback.mjs
```


Commit 14 target verification:

```bash
npm run build
npm run build:pages
```

`build:pages` must create both `dist/index.html` and `dist/404.html`. Vite may emit a warning from `gray-matter`/`js-yaml` about direct eval in a dependency; previous builds completed despite that dependency warning.


## Commit 15 note

Page metadata now flows from Markdown frontmatter into runtime document head updates.

```txt
frontmatter
└─ metadata/pageMeta.ts
   └─ composables/usePageMeta.ts
      └─ document.title / meta / canonical
```

Default site config lives in:

```txt
src/metadata/siteConfig.ts
```

Default OG image lives in:

```txt
public/og-default.svg
```

This is a runtime SPA meta layer. Full route-level static OG previews for every social crawler require a future prerender/SSG commit.

## Commit 16 — Content Validation Gate

Content validation is now part of the build path.

```bash
npm run validate:content
npm run build
npm run build:pages
```

The validator checks Markdown frontmatter, slug uniqueness, reserved route conflicts, related slugs, local assets, enum values, date fields, and SEO metadata.

The rule is simple: missing content is not silently patched. Invalid content fails before deploy.


## Commit 17 — Markdown Image / Lightbox Foundation

Markdown 기본 이미지를 Vue-native Lightbox로 연결했다.

```txt
Markdown image
→ imageRenderRule
→ data-vt-lightbox
→ useLightbox
→ MarkdownLightbox.vue
```

지원:

- 이미지 클릭 확대
- ESC 닫기
- backdrop / close 버튼 닫기
- ArrowLeft / ArrowRight 이동
- caption 표시
- body scroll lock
- contentDir 기준 Markdown image asset resolve

보류:

- video lightbox
- pinch zoom
- legacy Super/Notion Lightbox DOM adapter

## Commit 18 — Markdown Caption Tooltip / Chip Native Port

Markdown 기본 이미지는 이제 `captioned-image` placeholder로 렌더링된 뒤 `CaptionedImage.vue`로 마운트된다.

```txt
Markdown image title
└─ captionTag.ts
   └─ caption / chip 분리
      └─ CaptionedImage.vue
         └─ tooltip / chip / lightbox data bridge
```

지원 예시:

```md
![대체 텍스트](./images/cover.svg "[필수] 대표 이미지 설명")
```

명시 directive도 지원한다.

```md
::captioned-image
src: ./images/cover.svg
alt: 대표 이미지
caption: Directive 기반 캡션
tag: 선택
lightbox: true
::
```

허용 chip tag는 `필수`, `선택`, `기타`만이다. alt는 접근성 텍스트이고 tooltip caption으로 자동 승격하지 않는다.

## Content Authoring

Create a new page:

```bash
npm run new:page -- works project-name
npm run new:page -- lab experiment-name
npm run new:page -- tools tool-name
```

Page folders follow this shape:

```txt
src/content/pages/{category}/{slug}/
  index.md
  images/
  videos/
  README.md
```

Run content audit:

```bash
npm run audit:content
```

Run the full launch check:

```bash
npm run check:launch
```

Authoring guides live in `docs/authoring/`.

## CSV Authoring

Create a CSV-authored page:

```bash
npm run new:page -- works project-name --csv
npm run new:page -- lab experiment-name --csv
npm run new:page -- tools tool-name --csv
```

Generate Markdown from one CSV:

```bash
npm run csv:page -- src/content/pages/works/project-name/page.csv
```

Generate Markdown for every `page.csv`:

```bash
npm run csv:pages
```

CSV-based pages treat `page.csv` as the authoring source and `index.md` as generated output.

## GitHub Pages Release Workflow

Deployment contract:

```txt
source branch: main
deploy branch: gh-pages
Pages folder: / root
custom domain: varun.tools
CNAME: always generated
```

Check the current Git state:

```bash
npm run git:status
```

Prepare release artifacts locally:

```bash
npm run release:prepare
```

Create a local `gh-pages` deployment commit from the current `dist` contents:

```bash
npm run release:pages
```

Create and push the deployment commit:

```bash
npm run release:pages -- --push
```

Preview the deployment payload without committing or pushing:

```bash
npm run release:pages -- --dry-run
```

`gh-pages` is generated output. Do not edit it manually.
## Lightbox Control QA

Lightbox close/previous/next controls use explicit icon spans and centered button styles.
Run the control smoke after lightbox UI edits:

```bash
npm run smoke:lightbox-controls
```



## Product Pages

Create a store-ready product page:

```bash
npm run new:page -- products product-slug --csv
```

Product pages use public pricing, Toss Payments checkout links, and Cloudflare-ready digital download fields.

```yaml
product:
  type: physical
  status: coming-soon
  sku: VT-PRODUCT-001
  price: 12000
  currency: KRW
  priceVisible: true
  checkoutProvider: toss-payments
  checkoutUrl: ""
  downloadProvider: cloudflare
  downloadUrl: ""
  showWhenUnavailable: true
```


## Homepage Index

Commit 49 adds homepage sections that collect page metadata from frontmatter instead of duplicating card data manually.

- `featured: true` marks pages for featured sections.
- `order` controls card ordering.
- Product cards read `product.status`, `product.price`, `product.currency`, `product.checkoutUrl`, and `product.externalStoreUrl`.
- `coming-soon` and `sold-out` products may remain visible when `product.showWhenUnavailable: true`.

Homepage sections use:

```md
::home-section
title: Featured Products
source: products
featured: true
limit: 6
layout: product-grid
showUnavailable: true
::
```


## Commit 50-0 — Seed Content / Empty Section Guard

Homepage sections now support guarded empty states before the wide media rail work.

```txt
HomeSection.vue
└─ emptyMode: notice | hide
   ├─ notice: render a user-facing empty card
   └─ hide: remove the empty section from layout flow
```

Run the focused smoke:

```bash
npm run smoke:seed-content-empty
```

Production product seed pages are intentionally not generated in this commit. Product name, SKU, price, and checkout URL remain operational SSOT data.

## Commit 51 — Image Optimization / Asset Naming Guard

Image operating-quality checks are now split from asset path validation.

```bash
npm run audit:assets   # referenced asset paths exist
npm run audit:images   # image naming, size, representative image, gallery thumb warnings
npm run smoke:image-assets
```

`audit:images` is warning-first and does not rewrite images. Use `node scripts/audit-images.mjs --strict` only when launch assets are stable enough to make warnings blocking.

Image authoring SSOT:

```txt
docs/authoring/image-assets.md
```

## CSV Store Metadata v2

Product CSV files can carry store metadata such as `license`, `collection`, `material`, `size`, `releaseDate`, `shippingNote`, `refundNote`, `digitalDeliveryNote`, `policyNote`, `inquiryUrl`, and `externalUrl`.

```bash
npm run csv:page -- src/content/pages/products/product-slug/page.csv
npm run smoke:csv-store-metadata
```

A dummy catalog product exists for editing the store page structure without inventing a live product:

```txt
src/content/pages/products/dummy-catalog/page.csv
```

### Commit 55 — Product filter / search index

```bash
npm run generate:search-index
npm run smoke:product-filter
npm run smoke:search-index
```

`products/index.md` uses `::product-catalog` for product browsing. `public/search-index.json` is generated as the static foundation for the later command palette.

## Commit 57 — Inquiry Form UI / Google Form Intake Gate

The site now includes a public `/inquiry` page and a Markdown-mounted inquiry form.

```bash
npm run smoke:inquiry-form
```

The inquiry form requires nickname, submission gate code, category, title, message, and consent. Email is optional. Google Form submission is controlled through `src/config/inquiryForm.ts`; incomplete config falls back to mock mode.

The user-facing submission password is internally named `gateCode`. In Commit 57 it is a submission friction field, not a login password, lookup key, or stored credential.


## Inquiry Google Form wiring

Commit 58 adds Google Form wiring checks for the public inquiry page.

```bash
npm run smoke:inquiry-form
npm run smoke:inquiry-google-form
```

The Google Form config lives in `src/config/inquiryForm.ts`. Use a `formResponse` action URL and `entry.xxxxx` mappings. The UI uses “접수 요청 완료” wording because Google Form `no-cors` submission cannot strictly prove the response body in-browser.


## Commit 59 — Inquiry Response Workflow / Google Sheet Triage Pack

Commit 59 adds the manual operating layer for inquiries received through Google Form and handled in the linked Google Sheet.

```bash
npm run smoke:inquiry-response-workflow
```

The workflow docs live in:

```txt
docs/ops/inquiry-response-workflow.md
docs/ops/inquiry-sheet-columns.csv
docs/templates/inquiry-reply-templates.md
```

This commit does not implement a site admin dashboard, inquiry lookup, Google Sheets API integration, Apps Script automation, Cloudflare Worker, D1/KV persistence, or automatic email replies. `gateCode` remains a submission friction value only and must not be used for login, lookup, authentication, or user verification.

## Commit 60 — Launch QA Pack

Commit 60 adds the manual launch QA pack:

```txt
docs/qa/launch-qa-matrix.md
docs/qa/manual-screenshot-checklist.md
docs/qa/qa-run-template.md
```

Run:

```bash
npm run smoke:launch-qa
```

The QA pack fixes required viewport widths, required launch pages, command/product/inquiry/media interaction checks, screenshot naming rules, and PASS / WARNING / BLOCKER / N/A review language. It does not add Playwright, Puppeteer, image diffing, or Lighthouse automation.

## Commit 61 — Playwright Screenshot Harness

Commit 61 adds a repeatable screenshot capture harness for the Commit 60 launch QA matrix.

```bash
npm run smoke:playwright-screenshots
npm run qa:screenshots
```

Useful variants:

```bash
npm run qa:screenshots:dry-run
npm run qa:screenshots:headed
npm run qa:screenshots -- --base-url=http://127.0.0.1:4173
```

Screenshots are written to:

```txt
artifacts/qa/screenshots/current/{viewport}/{route}.png
```

The harness is a camera, not a judge. Commit 61 does not add baseline images, visual diff assertions, CI artifact upload, or launch-blocking pixel checks.

## Commit 62 Visual Diff Workflow

```bash
npm run qa:screenshots
npm run qa:baseline
npm run qa:diff
npm run qa:diff:strict
npm run smoke:visual-diff
```

`qa:diff` never updates the baseline. Promote a new baseline only with `qa:baseline` after reviewing the current screenshots.

## Commit 63 — Store taxonomy

Store product shelves now use explicit taxonomy fields instead of putting every classification into `tags`. See `docs/authoring/store-taxonomy.md`.

## Commit 64 — Store Navigation Rail

- Added category landing pages at `/products/categories` and `/products/categories/templates`.
- Added `::store-nav` for category navigation/counts.
- Added `npm run smoke:store-navigation`.

## Commit 66 — Launch content freeze

Commit 66 adds a launch-readiness layer for final store release checks.

```bash
npm run audit:launch-readiness
npm run smoke:launch-freeze
```

The launch readiness SSOT is `src/config/launchReadiness.ts`.
In `prelaunch`, demo products and asset warnings are visible warnings.
In `launch-candidate` or `production`, the same checks can be promoted to blockers by changing the config.

## Commit 67 — Product Upload SSOT

Commit 67 adds `product.manifest.json` as the upload/intake SSOT for real store products.

```bash
npm run audit:product-upload
npm run smoke:product-upload
```

Digital products are modeled as post-purchase Cloudflare R2 delivery:

```txt
delivery.mode = post-purchase
delivery.provider = cloudflare-r2
delivery.access = private
delivery.workerIntegration = future
```

The static site must not expose paid product files through public `downloadUrl`, raw R2 public URLs, or local static download files. A future Cloudflare Worker should grant access after purchase confirmation.

## Commit 68 — Cloudflare R2 Delivery Worker Contract

Digital product delivery now has a Worker-side contract under `workers/delivery/`.

```bash
npm run generate:delivery-manifest
npm run smoke:delivery-worker
```

The Worker manifest is generated from `product.manifest.json` files and must remain Worker-only. The static site must not expose private R2 object keys or paid-file URLs.
## Commit 70 — R2 product upload flow

Use `_private/product-files/{slug}/` for paid product file staging. Run `npm run r2:plan`, `npm run r2:publish:dry-run`, `npm run r2:publish`, `npm run r2:seal`, and `npm run r2:verify`.
