# Launch Checklist

Fast content audit:

```bash
npm run audit:content
```

Full launch check:

```bash
npm run check:launch
```

Manual review: built site, gallery sections, lightbox zoom/pan, metadata/copy link, video playback, and mobile lightbox gestures.

## CSV authoring check

Run CSV smoke before launch checks:

```bash
npm run smoke:csv-authoring
npm run check:launch
```


## Seed content / empty section check

Run the empty section guard smoke before layout work or launch review:

```bash
npm run smoke:seed-content-empty
```

Manual checks:

- Featured Products does not show raw `No entries yet.` copy.
- Products index shows a user-facing empty notice when no products exist.
- Featured Works has at least the `VARUNTOOLS Showroom` seed work.
- `emptyMode: hide` does not leave a visible blank section gap.

## Image asset check

Run the image asset guard before visual QA and launch review:

```bash
npm run audit:images
npm run smoke:image-assets
```

Manual checks:

- Important pages have `cover`, `thumbnail`, and `ogImage` where appropriate.
- Product detail pages have real representative product images only.
- Gallery-heavy pages use thumbnail paths when needed.
- Large raster files are converted manually before launch.
- Filenames stay lowercase kebab-case.

## Product CTA checks

- [ ] 모든 상품 상세 페이지에 `::product-cta`가 있는가?
- [ ] `available` 상품에 `checkoutUrl` 또는 `externalStoreUrl`이 있는가?
- [ ] 디지털 `available` 상품에 `downloadUrl` 또는 다운로드 정책 안내가 있는가?
- [ ] 외부 결제/스토어 링크가 새 탭과 `rel="noopener noreferrer"`로 열리는가?
- [ ] 가짜 상품명, 가짜 가격, 가짜 결제 링크가 들어가지 않았는가?


## Store policy and trust blocks

- [ ] `/policies` and all child policy pages open correctly.
- [ ] Policy pages use `visibility: hidden` and do not appear in homepage/work collections.
- [ ] Product detail templates include both `::product-cta` and `::product-trust`.
- [ ] Physical products show shipping guidance when shipping is required.
- [ ] Digital products show digital download guidance.
- [ ] Products with checkout/external store links show privacy/external-flow guidance.
- [ ] Policy wording avoids fixed legal promises before final review.

Run:

```bash
npm run smoke:store-policies
npm run smoke:product-trust
```

## Commit 55 — Product filter / search index checks

```bash
npm run generate:search-index
npm run smoke:product-filter
npm run smoke:search-index
```

Manual checks:

```txt
- Products page renders product filter controls.
- Search filters title, description, tags, and product metadata.
- Status/type/tag filters do not expose draft or hidden products.
- public/search-index.json contains public pages.
- hidden policy pages are not included in search-index.json.
```

## Commit 56 — Command Palette UI

Before launch:

```bash
npm run generate:search-index
npm run smoke:search-index
npm run smoke:command-palette
```

Manual checks:

```txt
- Ctrl+K / Command+K opens the palette.
- Escape closes the palette.
- ArrowUp / ArrowDown changes the active result.
- Enter opens the active result.
- Product, work, lab, and tools entries appear from search-index.json.
- Hidden policy pages do not appear in command palette results.
```

## Commit 57/58 — Inquiry Form / Google Form intake gate

Before launch:

```bash
npm run smoke:inquiry-form
npm run smoke:inquiry-google-form
npm run smoke:inquiry-response-workflow
npm run smoke:inquiry-intake-contract
```

Manual checks:

```txt
- /inquiry opens and renders the inquiry form.
- Nickname is required; anonymous inquiries cannot be submitted.
- Submission gate code is required and clearly described as non-login/non-lookup.
- Email is optional.
- Category, title, message, and consent are required.
- Google Form config is either fully mapped or intentionally left in mock mode.
- Google Form action URL uses formResponse, not viewform.
- Required Google Form mappings use entry.xxxxx format.
- The UI says 접수 요청 완료, not a verified database receipt.
- The UI states that inquiry lookup is not currently provided.
- gateCode is not stored in localStorage/sessionStorage/public JSON/generated Markdown.
- Google Sheet response workflow columns are prepared.
- opsStatus / opsPriority / replyNeed / replyChannel are understood before launch.
- Reply templates are available for product, commission, support, collaboration, and general inquiries.
- gateCode is not used for inquiry lookup, authentication, or user verification.
```

## Commit 60 — Visual QA Matrix / Launch Screenshot Checklist

Before launch, run the QA pack smoke and create a manual QA run from the template:

```bash
npm run smoke:launch-qa
```

Manual QA SSOT:

```txt
docs/qa/launch-qa-matrix.md
docs/qa/manual-screenshot-checklist.md
docs/qa/qa-run-template.md
```

Required viewport widths:

```txt
1440, 1280, 1024, 768, 430, 390, 360
```

Manual checks:

```txt
- Required pages are checked at every required viewport.
- Command Palette opens and navigates with keyboard.
- Product catalog filters and empty states are readable.
- Product detail CTA/trust blocks do not fake checkout or legal promises.
- Inquiry form blocks anonymous/empty submissions and describes gateCode as non-login/non-lookup.
- Media rail is wider than body text but does not stretch markdown copy.
- 360px mobile has no horizontal overflow on required pages.
- QA result uses PASS / WARNING / BLOCKER / N/A language.
```

## Commit 61 — Playwright Screenshot Harness

Before launch, verify the screenshot harness wiring:

```bash
npm run smoke:playwright-screenshots
```

When screenshots are needed, build and capture:

```bash
npm run build
npm run qa:screenshots
```

Optional dry run:

```bash
npm run qa:screenshots:dry-run
```

Manual checks:

```txt
- visual route list matches the launch QA matrix.
- visual viewport list matches the launch QA matrix.
- screenshots are written to artifacts/qa/screenshots/current/.
- screenshot artifacts are not committed as runtime source.
- no visual diff/baseline failure policy is implied in Commit 61.
```

## Commit 62 Visual Diff Checklist

```bash
npm run smoke:visual-diff
npm run qa:screenshots
npm run qa:diff
```

- Promote baseline only after a manual visual review.
- Do not treat missing baseline as accepted release evidence.
- Use `npm run qa:diff:strict` during final content freeze.

## Commit 63 taxonomy check

- [ ] Product `tags` are not replacing `category` or `collection`.
- [ ] Product pages include `product.category` before launch.
- [ ] `npm run smoke:store-taxonomy` passes.

## Commit 64 Store Navigation Checks

- Run `npm run generate:search-index` after adding category pages.
- Run `npm run smoke:store-navigation`.
- Confirm `/products/categories/templates` filters with `defaultCategory: templates`.

## Commit 66 — Launch readiness freeze

Before release, run:

```bash
npm run audit:launch-readiness
npm run smoke:launch-freeze
```

Review:

- `/products/dummy-catalog`
- `/products/spec-playground`
- Google Form connection state
- policy page review flags
- OG image and thumbnail warnings
- screenshot baseline manifest
- visual diff report readiness

The readiness mode is controlled from:

```txt
src/config/launchReadiness.ts
```

## Commit 67 — Product upload SSOT

Before adding or launching real products, verify every product package has an upload manifest:

```bash
npm run audit:product-upload
npm run smoke:product-upload
```

Required package SSOT:

```txt
src/content/pages/products/{slug}/product.manifest.json
```

Check:

- [ ] `product.manifest.json` exists for each real product page.
- [ ] `slug` matches the product folder name.
- [ ] `sku` is unique.
- [ ] demo products use `isDemo: true`.
- [ ] real products use `isDemo: false`.
- [ ] digital products use `delivery.mode: post-purchase`.
- [ ] digital products use `delivery.provider: cloudflare-r2`.
- [ ] paid files are not exposed through public `downloadUrl` or `publicUrl` fields.
- [ ] Cloudflare R2 key prefix is present.
- [ ] `launch.readyForCheckout=true` is not set until checkout and delivery are ready.

## Commit 68 delivery worker checks

Before a digital product launch:

- Run `npm run generate:delivery-manifest`.
- Run `npm run smoke:delivery-worker`.
- Confirm `workers/delivery/wrangler.toml` uses the real R2 bucket name.
- Confirm paid files are not linked from `public/`, Markdown, CSV, or `downloadUrl` fields.
- Confirm downloads still require a future purchase grant flow before release.
## Commit 70 R2 upload readiness

- [ ] Product files are staged outside public assets.
- [ ] `npm run r2:plan` reviewed.
- [ ] `npm run r2:publish:dry-run` reviewed.
- [ ] `npm run r2:seal` performed only after upload.
- [ ] `npm run r2:verify` passes.


## Commit 73 checkout handoff note

The checkout success page may guide buyers to `/claim`, but it does not create, validate, or activate claim rights. Checkout handoff metadata is not a grant. Grants are created only by server-side payment verification and webhook activation.

## Commit 74 payment grant flow check

Before launch, run `npm run smoke:payment-grant-flow`. Production must not rely on `successUrl` as proof of payment. `PAYMENT_WEBHOOK_MODE` and `TOSS_RETRIEVE_MODE` must be explicitly configured as `test` or `live`; `not_configured` is fail-closed.

## Commit 75 product manifest/page gate

Before launch, run:

```bash
npm run smoke:product-sync
npm run product:sync-check
```

`product:sync-check` is read-only and must not perform a silent auto-fix. If drift is intentional and public-safe, run `npm run product:sync` explicitly, review the diff, and then run the check again.

## Commit 76 admin surface boundary

- Run `npm run smoke:admin-surface` before treating the admin app split as valid.
- The public storefront must not gain an `/admin` route.
- `admin.varun.tools` is intended to sit behind Cloudflare Access.
- The admin app must call an Admin API Worker; browser code must not query D1 directly.
- `admin:build` is intentionally not forced inside `check:launch` in Commit 76 because the admin app is a separate deployment surface.

## Commit 78 ops ledger checks

Run `npm run smoke:ops-ledger`. Confirm ops documents exist and no Admin API write endpoint or admin write button was introduced.


## Commit 79 variant / bundle note

Variant and bundle fields (`variantId`, `bundleId`, `licenseScope`, and computed `deliverableCount`) are read-only entitlement metadata. Public pages must never expose `deliverableSetId`, `deliverableIds`, `r2Key`, `privatePath`, or `entitlement_scope_json`.


Commit 80 launch checks include smoke:admin-write-guardrails to ensure dry-run only write controls remain blocked.
