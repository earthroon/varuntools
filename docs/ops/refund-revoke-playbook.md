# Refund and Revoke Playbook

Refund and revoke are related but separate. Refund belongs to the payment/order ledger. Revoke belongs to the grant ledger. A refund does not automatically prove a grant was revoked. A revoke does not automatically prove a payment was refunded. Review orderId, paymentProvider, paymentKeyMasked, provider-side refund state, grant status, and downloadCount. Manual review required. Commit 78 does not execute write actions.


Commit 80 introduces dry-run planning only. Runtime revoke and refund execution remain disabled.
