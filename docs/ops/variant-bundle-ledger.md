# Variant / Bundle Ledger

Variant and bundle grants must be interpreted as entitlement scopes, not as display labels.

## Grant ledger fields

- `variantId`: variant-level purchase scope, such as `personal` or `commercial`.
- `bundleId`: bundle-level purchase scope.
- `licenseScope`: human-readable license scope.
- `deliverableCount`: computed count only. Do not expose private deliverable IDs or R2 keys in default admin responses.

## Reissue review

Before any reissue, check order, productSlug, variantId, bundleId, licenseScope, downloadCount, expiresAt, and delivery incidents. A bundle grant may contain several product-scoped deliverables, so never reissue from productSlug alone.

## Refund / revoke review

Refund and revoke remain separate events. If a grant has a variant or bundle entitlement, confirm the purchased scope before revocation or replacement.


Before revoke or reissue, operators must review variantId, bundleId, licenseScope, and entitlement scope. Commit 80 keeps these actions dry-run only.
