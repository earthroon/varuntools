# Ops Export Contract

Exports are for operator review and offline backup. Sales export columns: orderId, productSlug, paymentProvider, paymentStatus, opsStatus, amount, currency, paymentKeyMasked, buyerEmailMasked, grantStatus, grantIdMasked, webhookResultCode, createdAt, updatedAt, supportFlag. Grant export columns: grantId, orderId, productSlug, status, opsStatus, deliverableCount, downloadCount, maxDownloads, expiresAt, buyerEmailMasked, createdAt, reissueCandidate. Forbidden export fields: raw payment key, raw buyer email, rawJson, r2Key, privatePath, downloadUrl, publicUrl, Toss raw payload, Cloudflare secret, Access JWT.


## Commit 79 variant / bundle note

Variant and bundle fields (`variantId`, `bundleId`, `licenseScope`, and computed `deliverableCount`) are read-only entitlement metadata. Public pages must never expose `deliverableSetId`, `deliverableIds`, `r2Key`, `privatePath`, or `entitlement_scope_json`.


Admin write dry-run exports must not include paymentKey raw values, buyerEmail raw values, rawJson, r2Key, privatePath, downloadUrl, or publicUrl.
