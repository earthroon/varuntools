# Buyer Claim Flow

Commit 71 creates the buyer-facing claim portal. The frontend collects claim token, email, and order id style inputs and displays safe status messages. Actual redemption happens at the Worker `GET /download/:grantId/:deliverableId` route. The frontend must not decide grant validity, expose R2 keys, store grant ids in local/session storage, or reuse inquiry submission values as purchase authorization.


## Commit 73 checkout handoff note

The checkout success page may guide buyers to `/claim`, but it does not create, validate, or activate claim rights. Checkout handoff metadata is not a grant. Grants are created only by server-side payment verification and webhook activation.

## Commit 74 payment activation boundary

`/claim` may guide buyers after checkout, but it does not create grants. Grants are created only by the delivery Worker after `POST /webhooks/toss` is received, the payment is retrieved server-to-server, and the product delivery contract is verified.

## Commit 78 support boundary

Buyer claim issues may escalate to support-needed, delivery-failed, or reissue-needed. The claim portal does not expose admin ledgers, raw payment keys, R2 keys, or raw buyer email data.
