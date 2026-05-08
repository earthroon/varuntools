# Product Variant / Bundle Delivery Expansion

Commit 79 adds variant, deliverableSet, and bundle contracts. A variant is not a decorative option. It is a purchase-right difference that must resolve into a grant entitlement. A bundle is not a UI group. It is a set of product or variant rights that must resolve into deliverable permissions.

## SSOT

- `product.manifest.json`: variant, deliverableSet, and bundle authoring SSOT.
- `index.md`: public-safe variant display only.
- `purchase_grants.entitlement_scope_json`: actual purchased entitlement scope.
- Worker delivery manifest / R2: private file locations.

## Public fields allowed in `index.md`

`variant.id`, `label`, `status`, `licenseScope`, `price`, `currency`, `checkoutMode`, `checkoutUrl`, `default`, `hasVariants`, and `defaultVariantId`.

## Public fields forbidden in `index.md`

`deliverableSetId`, `deliverableIds`, `r2Key`, `privatePath`, `entitlement_scope_json`, `paymentKey`, and `buyerEmail`.

## Payment activation

Payment metadata may include `productSlug`, `variantId`, `bundleId`, and `expectedAmount`. The Worker validates that variant or bundle references exist, are active, and resolve to valid deliverable sets before creating a grant. Missing `variantId` is not silently defaulted.

## Download redemption

The private download Worker validates `/download/:grantId/:deliverableId` against the grant entitlement. Product-level grants still use `deliverable_ids_json`; new variant and bundle grants prefer `entitlement_scope_json` and fail closed with `GRANT_DELIVERABLE_MISMATCH` outside the granted scope.
