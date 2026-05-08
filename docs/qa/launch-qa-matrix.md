# VARUNTOOLS Launch QA Matrix

Commit 60 fixes the manual visual QA scope for launch review. This file is the SSOT for pages, viewport sizes, pass/warning/blocker language, and evidence rules.

## Scope

Manual QA only. No Playwright, Puppeteer, image diffing, Lighthouse automation, deployment monitoring, or layout redesign is introduced here.

## Viewport matrix

| Viewport | Label | Purpose |
|---:|---|---|
| 1440 | desktop | wide desktop density and rail balance |
| 1280 | desktop narrow | notebook density and home/media rail balance |
| 1024 | tablet landscape | tablet landscape navigation and grid collapse |
| 768 | tablet portrait | tablet portrait layout and command/inquiry surfaces |
| 430 | mobile large | large mobile layout and touch targets |
| 390 | mobile standard | standard mobile layout and text rhythm |
| 360 | mobile small | small mobile overflow, wrapping, and CTA safety |

## Required pages

| Route | Required checks |
|---|---|
| `/` | home sections, featured works/products notices, card density, command palette trigger visibility |
| `/products` | product catalog filters, search input, dummy catalog card, unavailable visibility rules |
| `/products/dummy-catalog` | product CTA, trust blocks, metadata, image fallback, coming-soon state |
| `/inquiry` | inquiry form fields, gateCode helper copy, Google Form status notice, consent flow |
| `/lab-markdown-gallery` | captioned images, gallery strip, mini gallery, before/after, video player, media rail |
| `/policies` | policy hub links and hidden-list behavior |
| `/policies/store` | store policy scaffold readability |
| `/policies/shipping` | shipping policy scaffold readability |
| `/policies/refund` | refund policy scaffold readability |
| `/policies/privacy` | privacy policy scaffold readability |
| `/policies/digital-download` | digital download scaffold readability |

## Conditional pages

Add these when real content exists: `/products/{real-product-slug}`, `/works/{real-work-slug}`, `/tools/{real-tool-slug}`. Do not invent product, price, SKU, checkout, or legal content to satisfy QA.

## Named QA areas

- Command Palette
- Product catalog
- Inquiry form
- Media breakout rail

## Interaction matrix

| Interaction | Pages | Viewports | Expected result |
|---|---|---|---|
| Command Palette open | all pages | 1440, 390 | Ctrl/Command+K opens palette, Escape closes it |
| Command Palette navigation | all pages | 1440, 390 | Arrow keys move active result, Enter navigates |
| Product catalog search | `/products` | all | query filters title, description, tags, and product metadata |
| Product status filter | `/products` | 1440, 430, 360 | draft/hidden products stay hidden |
| Product CTA state | `/products/dummy-catalog` | all | coming-soon state is disabled and does not fake checkout |
| Product trust links | product detail pages | 1440, 390 | policy links are visible and readable |
| Inquiry form validation | `/inquiry` | all | required fields block empty submit |
| Inquiry gate helper | `/inquiry` | all | gateCode is described as non-login/non-lookup |
| Inquiry submit status | `/inquiry` | 1440, 390 | copy says 접수 요청 완료, not verified database receipt |
| Lightbox open/close | `/lab-markdown-gallery` | 1440, 430 | images open, close, and preserve controls |
| Media breakout rail | `/lab-markdown-gallery` | 1440, 1280, 1024 | media is wider than text without widening markdown text |

## Pass / warning / blocker language

| Status | Meaning |
|---|---|
| PASS | No visible launch issue found for this item |
| WARNING | Launch can continue, but the issue should be reviewed or queued |
| BLOCKER | Launch should not continue until this issue is fixed |
| N/A | Item is not applicable because the page/content does not exist yet |

## Blocker examples

- Page does not load.
- Main navigation is unusable.
- Product CTA links to a fake or broken checkout URL.
- Inquiry form can submit without nickname, gateCode, title, message, or consent.
- gateCode is presented as account authentication or lookup password.
- Mobile layout has horizontal overflow on required pages.
- Media rail widens the main reading column.
- Hidden policy pages appear in public product/work/search listings.

## Warning examples

- Missing final OG image.
- Thumbnail still uses placeholder image.
- Caption copy is awkward but structurally valid.
- Image is above preferred optimization size but below hard blocker threshold.
- Dummy catalog is still visible before final launch review.

## Evidence rule

Each QA run should copy `docs/qa/qa-run-template.md` and record date, build or zip name, reviewer, browser, viewport coverage, page coverage, PASS/WARNING/BLOCKER/N/A table, screenshot folder path, and follow-up notes.

## Commit 61 screenshot harness

The automated screenshot harness follows this QA matrix but does not replace manual judgment.

```bash
npm run qa:screenshots
```

Screenshot output:

```txt
artifacts/qa/screenshots/current/{viewport}/{route}.png
```

Commit 61 does not introduce baseline images, visual diff assertions, or launch-blocking screenshot comparisons.

## Commit 63 taxonomy QA

Check `/products` for Category and Collection facets at desktop, tablet, and mobile widths.

## Commit 64 store category QA

Check /products/categories and /products/categories/templates at all launch viewport widths. Confirm store navigation counts, disabled empty shelves, and current category state.
