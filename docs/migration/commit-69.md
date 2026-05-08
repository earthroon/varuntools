
# Commit 69 — Purchase Grant / Payment Webhook Contract

Adds the D1-backed purchase grant contract and Toss webhook verification skeleton.

The Worker remains fail-closed until `PURCHASE_DB`, `GRANT_VALIDATION_MODE=configured`, `TOSS_RETRIEVE_MODE=configured`, and `TOSS_SECRET_KEY` are set in deployment.
