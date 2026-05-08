# Admin API Read Model

Admin API Worker exposes read-only D1 binding read models for purchase_orders, purchase_grants, webhook_events, products, and delivery incidents. It is protected by Cloudflare Access and redacts payment keys, buyer emails, rawJson, r2Key, privatePath, downloadUrl, and publicUrl. It is SELECT only.

## Commit 78 ops ledger relation

Commit 78 maps Admin API read models into opsStatus values. The API remains SELECT only. Revoke, reissue, refund, and webhook replay actions remain disabled.


## Commit 79 variant / bundle note

Variant and bundle fields (`variantId`, `bundleId`, `licenseScope`, and computed `deliverableCount`) are read-only entitlement metadata. Public pages must never expose `deliverableSetId`, `deliverableIds`, `r2Key`, `privatePath`, or `entitlement_scope_json`.


Commit 80 adds dry-run write guardrails. Admin API read models remain SELECT-only; write actions are still blocked.
