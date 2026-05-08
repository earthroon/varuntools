# Grant Ledger

The grant ledger maps purchase_grants into an operator-readable view of delivery rights. Columns: grantId, orderId, productSlug, status, opsStatus, deliverableCount, downloadCount, maxDownloads, expiresAt, buyerEmailMasked, createdAt, revokedAt, revokedReason, reissueCandidate. active with zero downloads maps to grant-created. active with downloads maps to downloaded. expired grants map to expired. revoked maps to revoked. refunded maps to refunded. Commit 78 is read-only.


## Commit 79 variant / bundle note

Variant and bundle fields (`variantId`, `bundleId`, `licenseScope`, and computed `deliverableCount`) are read-only entitlement metadata. Public pages must never expose `deliverableSetId`, `deliverableIds`, `r2Key`, `privatePath`, or `entitlement_scope_json`.
