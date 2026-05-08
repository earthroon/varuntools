# Commit 73 — Checkout Handoff / Payment Success Bridge

## Added

- `src/utils/checkoutHandoff.ts`
- `src/content/pages/checkout/success/index.md`
- `src/content/pages/checkout/fail/index.md`
- `scripts/smoke-checkout-handoff.mjs`
- `docs/authoring/checkout-handoff.md`
- `BAKE_REPORT_COMMIT_73.md`

## Changed

- Product frontmatter now supports `checkoutProvider`, `checkoutMode`, `checkoutUrl`, `successUrl`, `failUrl`, and `claimRedirect`.
- Product CTA actions now resolve through checkout handoff modes.
- Product templates and CSV seed rows include checkout handoff fields.
- Content validation recognizes handoff modes and provider mismatches.
- Launch checks include `smoke:checkout-handoff`.

## Non-goals

- No webhook grant creation.
- No Toss secret hardening.
- No purchase order activation.
- No manifest-page sync auto-write.

## Next

Commit 74 should make payment webhook activation the only path from paid payment to D1 purchase grant creation.
