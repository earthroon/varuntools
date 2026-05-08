# Ops Status Registry

paid, grant-created, claim-opened, downloaded, expired, refunded, revoked, support-needed, delivery-failed, webhook-failed, and reissue-needed are the Commit 78 operating states. Ops status is interpretive and read-only. It does not mutate D1 and it does not execute revoke, reissue, refund, or webhook replay actions. Sources are purchase_orders, purchase_grants, webhook_events, and computed delivery incident state.
