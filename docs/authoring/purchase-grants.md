
# Purchase Grants

Purchase grants are the server-side permission records that allow a buyer to download private R2 deliverables after payment.

SSOT:

```txt
workers/delivery/migrations/0001_purchase_grants.sql
workers/delivery/src/db.ts
workers/delivery/src/grants.ts
```

Rules:

- The static site never creates grants.
- `successUrl` query parameters are not trusted.
- Inquiry `gateCode` is not a download credential.
- Grants are created only after the Worker verifies a payment server-to-server.
- The default Worker configuration is fail-closed.

## Commit 72 redemption fields

`status`, `expires_at`, `max_downloads`, and `download_count` define the delivery ledger. `deliverable_ids_json` is an authorization scope only. It is not a file path and must not contain R2 keys.


## Commit 73 checkout handoff note

The checkout success page may guide buyers to `/claim`, but it does not create, validate, or activate claim rights. Checkout handoff metadata is not a grant. Grants are created only by server-side payment verification and webhook activation.

## Commit 74 payment activation note

`purchase_grants`는 결제 successUrl이 아니라 서버 측 payment webhook activation 이후에만 생성됩니다. The Worker retrieves the payment by `paymentKey`, requires `status === 'DONE'`, validates the product delivery contract, and then creates a single grant for `orderId + productSlug`.

## Commit 75 sync boundary

`purchase_grants` are not manifest/page sync data. Grant IDs, payment keys, webhook event IDs, buyer email, private R2 keys, `downloadUrl`, and `publicUrl` must never be copied into public product pages by `product:sync`.

## Commit 76 admin surface note

`purchase_grants` are D1 ledger records. They may be viewed only through an Access-protected admin surface and an Admin API Worker read model. The storefront must not list grants, expose download counts, or read grant ledger state directly.

## Commit 78 grant ledger interpretation

purchase_grants remains the grant rights SSOT. Commit 78 defines ledger columns, reissue candidates, and revoke review playbooks, but it does not add write actions. Refund and revoke remain separate events.


## Commit 79 variant / bundle note

Variant and bundle fields (`variantId`, `bundleId`, `licenseScope`, and computed `deliverableCount`) are read-only entitlement metadata. Public pages must never expose `deliverableSetId`, `deliverableIds`, `r2Key`, `privatePath`, or `entitlement_scope_json`.

## Commit 83 atomic download consume

`purchase_grants` remains the download permission SSOT, but download permission is no longer finally decided by a read-only preflight. `validateGrant()` may reject obviously invalid requests early, but the final consume boundary is `consumeGrantDownloadAtomically()` in `workers/delivery/src/db.ts`.

The Worker must increment `download_count` with a conditional `UPDATE purchase_grants` statement (조건부 UPDATE) that requires:

- `id` matches the grant being redeemed.
- `status = 'active'`.
- `expires_at` is empty, null, or still in the future.
- `max_downloads` is null, or `download_count < max_downloads`.

If the conditional update changes zero rows, the Worker must re-read the grant and map the result to `GRANT_NOT_FOUND`, `GRANT_REVOKED`, `GRANT_INACTIVE`, `GRANT_EXPIRED`, `GRANT_DOWNLOAD_LIMIT_REACHED`, or `GRANT_CONSUME_CONFLICT` without returning the private object.
