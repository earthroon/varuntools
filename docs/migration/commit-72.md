# Commit 72 Migration Note — Delivery Worker Grant Redemption / Private R2 Download

Commit 72 hardens the server-side grant redemption SSOT: Cloudflare D1 `purchase_grants` -> Worker validation -> private R2 object -> `download_count` ledger. The static site remains outside the authorization boundary.

## Fail-closed rule

Every uncertain delivery state is fail-closed. A failed grant check, missing R2 object, or failed download ledger update returns an error instead of leaking a private file.
