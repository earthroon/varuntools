# Refund Note Dry-run

A refund-note dry-run prepares an operational note for a refund event. It is not a refund API call.

## Required review

1. Confirm orderId in sales ledger.
2. Confirm payment provider status externally.
3. Review paymentKeyMasked only; do not expose raw paymentKey.
4. Review linked grants.
5. Decide separately whether grant revoke is required.
6. Confirm the phrase `REFUND NOTE`.

## Commit 80 status

No purchase_orders mutation, no provider refund call, and no grant revoke are executed.
