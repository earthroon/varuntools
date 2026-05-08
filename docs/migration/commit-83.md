# Commit 83 — Atomic Download Grant Consume

## Commit

`fix(delivery): consume download grants atomically`

## SSOT

- Download permission SSOT: `purchase_grants` row in D1
- Consume boundary: `workers/delivery/src/db.ts#consumeGrantDownloadAtomically`
- Download response flow: `workers/delivery/src/index.ts#handleDownload`

## Change

Before this commit, the delivery worker validated `download_count < max_downloads` during `validateGrant()` and later incremented `download_count` with an unconditional update. Concurrent requests could pass the preflight together and over-consume a limited grant.

This commit moves the final permission decision to a conditional `UPDATE purchase_grants` statement. The update increments `download_count` only when the grant is active, unexpired, and under its download limit.

## Failure mapping

If the conditional update changes zero rows, the worker re-reads the grant and maps the result to the closest stable error code:

- `GRANT_NOT_FOUND`
- `GRANT_REVOKED`
- `GRANT_INACTIVE`
- `GRANT_EXPIRED`
- `GRANT_DOWNLOAD_LIMIT_REACHED`
- `GRANT_CONSUME_CONFLICT`

## Boundary

The R2 object is still fetched before the counter is consumed. This prevents missing private files from burning download count. The trade-off is intentional: after the counter is consumed, a client network failure may still count as a download because D1 and R2 streaming are not one transaction.

## Verification

```bash
npm run smoke:download-grant-consume
npm run smoke:delivery-worker
npm run smoke:payment-grant-flow
npm --prefix workers/delivery run check
```
