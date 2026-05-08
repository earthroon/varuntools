# Storefront / Admin / Server Surface Boundary

Commit 76 defines three separate surfaces.

## Storefront surface

Domain candidate:

```txt
varun.tools
```

Allowed routes include:

```txt
/products
/products/{slug}
/claim
/checkout/success
/checkout/fail
/inquiry
/policies/*
```

The storefront may show public product information, checkout handoff, claim guidance, inquiry flow, and public policy pages.

The storefront must not expose:

```txt
purchase_orders
purchase_grants
webhook_events
buyer email fields
raw grant identifiers as a list
payment identifiers
R2 object keys
private paths
download counts
refund or revoke operator notes
```

## Admin surface

Domain candidate:

```txt
admin.varun.tools
```

The admin app may display operator read models after the Admin API Worker is connected in Commit 77:

```txt
/orders
/grants
/webhook-events
/products
/delivery-incidents
```

Commit 76 keeps those pages as placeholders. The admin app must call the Admin API Worker and must not query D1 directly from browser code.

## Server-only surface

Server-only data belongs in Workers and D1/R2 bindings.

```txt
Delivery Worker:
  private R2 download and grant redemption

Admin API Worker:
  Access-aware D1 read model and later controlled write actions

D1:
  purchase_orders, purchase_grants, webhook_events

R2:
  private product deliverables
```

## Commit 77 connection

Commit 77 should add the Admin API Worker and D1 ops read model. Write actions such as grant revoke or reissue should remain blocked until an explicit playbook exists.

## Commit 78 ops pack boundary

Ops pages and playbook pages are read-only operator surfaces. They document sales ledger, grant ledger, refund, revoke, reissue, and R2 delivery incident handling without executing write actions.


The admin surface may display dry-run write action cards, but it must not expose runtime revoke, reissue, refund, or webhook replay execution.
