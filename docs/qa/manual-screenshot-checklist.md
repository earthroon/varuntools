# Manual Screenshot Checklist

Use this checklist during launch review. Keep screenshots outside the runtime source tree unless intentionally committed as QA evidence.

## Screenshot folder rule

```txt
qa-runs/YYYY-MM-DD-commit-60/
  1440/
  1280/
  1024/
  768/
  430/
  390/
  360/
```

Recommended filename pattern:

```txt
{viewport}-{route-slug}-{state}.png
```

Examples:

```txt
1440-home-default.png
390-products-filter-open.png
430-inquiry-validation-errors.png
1280-lab-markdown-gallery-lightbox-open.png
```

## Required viewport widths

- [ ] 1440 desktop
- [ ] 1280 desktop narrow
- [ ] 1024 tablet landscape
- [ ] 768 tablet portrait
- [ ] 430 mobile large
- [ ] 390 mobile standard
- [ ] 360 mobile small

## Required page screenshots

For each viewport, capture the default state for:

- [ ] `/`
- [ ] `/products`
- [ ] `/products/dummy-catalog`
- [ ] `/inquiry`
- [ ] `/lab-markdown-gallery`
- [ ] `/policies`
- [ ] `/policies/store`
- [ ] `/policies/shipping`
- [ ] `/policies/refund`
- [ ] `/policies/privacy`
- [ ] `/policies/digital-download`

## Required interaction screenshots

### Command Palette

- [ ] open state at 1440
- [ ] open state at 390
- [ ] active result state
- [ ] no-result state

### Product catalog

- [ ] default product list
- [ ] search query result
- [ ] status filter result
- [ ] empty filter result
- [ ] mobile stacked filter controls

### Product detail

- [ ] CTA section
- [ ] trust block section
- [ ] coming-soon disabled action
- [ ] policy links visible

### Inquiry form

- [ ] empty submit validation
- [ ] valid mock submit request
- [ ] Google Form status notice
- [ ] gateCode helper text
- [ ] consent checkbox focus state

### Media gallery

- [ ] captioned image default
- [ ] gallery strip default
- [ ] lightbox open
- [ ] before-after wiper
- [ ] video player rail
- [ ] mobile media rail reset

## Manual blocker checks

- [ ] No required page has horizontal overflow at 360.
- [ ] The main text column stays readable and does not stretch to media width.
- [ ] Product CTA does not create a fake checkout action.
- [ ] Inquiry gateCode is not described as login, lookup, or account password.
- [ ] Hidden policy pages do not appear in command palette results.
- [ ] Command Palette remains keyboard usable.
- [ ] Focus is visible on buttons, links, form inputs, and filters.
- [ ] Mobile tap targets are not cramped.

## Sign-off

```txt
Reviewer:
Date:
Build/ZIP:
Result: PASS / PASS WITH WARNINGS / BLOCKED
Screenshot folder:
Notes:
```

## Playwright capture shortcut

Commit 61 can generate default-state screenshots for the required routes and viewport widths:

```bash
npm run qa:screenshots
```

The command writes to:

```txt
artifacts/qa/screenshots/current/{viewport}/{route}.png
```

Use these captures as evidence helpers, not as automatic pass/fail judgment. Interaction states such as command palette open, lightbox open, validation errors, and focused controls still require manual capture unless a future commit adds state-specific capture routines.

## Commit 64 category routes

- /products/categories
- /products/categories/templates
