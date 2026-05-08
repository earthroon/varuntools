# Grant Revoke Dry-run

Revoke dry-run checks whether a grant could be revoked in a future write-enabled commit. It does not revoke anything.

## Pre-checks

1. Confirm grant exists.
2. Confirm orderId and productSlug.
3. Review variantId and bundleId.
4. Review licenseScope and entitlement scope.
5. Review downloadCount.
6. Confirm refund status in the payment provider if the reason is refund-completed.
7. Confirm the phrase `REVOKE GRANT`.

Refund and revoke are separate events. A refund does not automatically revoke a grant. A revoke does not automatically refund an order.

## Commit 80 status

Runtime revoke is unsupported. The dry-run returns an AdminWriteActionPlan only.
