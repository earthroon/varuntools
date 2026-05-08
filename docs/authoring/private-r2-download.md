# Private R2 Download / Grant Redemption

Commit 72 closes the buyer delivery worker loop for private product files.

## SSOT

- Purchase permission SSOT: Cloudflare D1 `purchase_grants`
- Private file SSOT: Cloudflare R2 object under the worker-only delivery manifest key
- Delivery contract SSOT: `workers/delivery/src/generated/product-delivery-manifest.json`

## Route

`GET /download/:grantId/:deliverableId` validates the grant, validates deliverable scope, finds the manifest deliverable, fetches the private R2 object, increments `download_count`, and returns the object body.

## Status code policy

- `403 GRANT_NOT_FOUND`
- `403 GRANT_INACTIVE`
- `403 GRANT_REVOKED`
- `410 GRANT_EXPIRED`
- `410 GRANT_DOWNLOAD_LIMIT_REACHED`
- `404 GRANT_DELIVERABLE_MISMATCH`
- `501 R2_BUCKET_NOT_CONFIGURED`
- `502 R2_OBJECT_MISSING`

## Download count rule

`download_count` is incremented only after the private R2 object is found. If the R2 object is missing, the count must not change.

## Fail-closed rule

Every uncertain delivery state is fail-closed: no private object is returned, and `download_count` is not incremented unless grant validation and R2 object lookup both succeed.

## Forbidden leaks

The static site must not receive or render `r2Key`, `publicUrl`, `downloadUrl`, or inquiry submission values as a purchase authorization mechanism.

## Commit 83 atomic consume rule

Commit 83 keeps the R2 object lookup before counter consumption so a missing private file does not burn a buyer's download count. After the R2 object exists, the Worker consumes the grant with `consumeGrantDownloadAtomically()`.

`download_count` is incremented only after the private R2 object is found, and only through a conditional `UPDATE purchase_grants` boundary. A successful response requires both the private object lookup and the atomic grant consume to succeed. If two requests try to redeem the final allowed download at the same time, only the request whose conditional update changes the row may receive the object body.

Smoke anchor: download_count is incremented only after the private R2 object is found.
