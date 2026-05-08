# Checkout Handoff

Commit 73 separates product CTA behavior from payment verification.

The checkout handoff fields are:

- `checkoutProvider`: `toss-payments`, `external`, `manual`, or `none`
- `checkoutMode`: `toss-ready`, `external-checkout`, `manual-inquiry`, or `disabled`
- `checkoutUrl`: checkout entry URL
- `successUrl`: provider success landing page
- `failUrl`: provider failure or cancel landing page
- `claimRedirect`: buyer claim guidance page, usually `/claim`

## Trust boundary

Payment success screens do not prove purchase rights. File delivery is activated only after server-side payment verification and grant creation.

`/checkout/success` is only a landing page. It can point buyers to `/claim`, but it must not create grants, expose download links, or trust provider query parameters as purchase rights.

`/checkout/fail` is only a landing page. It must not delete grants or make final server-side payment claims.

## Modes

### toss-ready

Uses Toss Payments checkout handoff metadata. The CTA may open `checkoutUrl`, but grant creation remains a Commit 74 webhook responsibility.

### external-checkout

Sends buyers to an external store. varun.tools does not treat that redirect as proof of purchase.

### manual-inquiry

Sends buyers to an inquiry flow for manual purchase or delivery.

### disabled

Keeps product purchase CTA disabled. This is the safe default.

## Commit 75 manifest/page sync gate

Checkout handoff metadata can exist both in `product.manifest.json` and in product page `index.md` frontmatter. Commit 75 adds `product:sync-check` so drift in `checkoutProvider`, `checkoutMode`, `checkoutUrl`, `successUrl`, `failUrl`, and `claimRedirect` is detected before publish.

The checker has no silent auto-fix behavior. Use `npm run product:sync` only when an explicit write is intended.
