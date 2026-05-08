# Commit 76 Migration — Admin App Split / Cloudflare Access Boundary

## Added

```txt
admin/package.json
admin/index.html
admin/vite.config.ts
admin/tsconfig.json
admin/src/main.ts
admin/src/App.vue
admin/src/router.ts
admin/src/types/admin.ts
admin/src/lib/adminApiClient.ts
admin/src/views/AdminHome.vue
admin/src/views/OrdersView.vue
admin/src/views/GrantsView.vue
admin/src/views/WebhookEventsView.vue
admin/src/views/ProductsView.vue
admin/src/views/DeliveryIncidentsView.vue
docs/admin/access-boundary.md
docs/admin/deployment.md
docs/admin/surface-boundary.md
docs/migration/commit-76.md
scripts/smoke-admin-surface.mjs
BAKE_REPORT_COMMIT_76.md
```

## Modified

```txt
package.json
scripts/check-launch.mjs
docs/authoring/launch-checklist.md
docs/authoring/product-manifest-page-sync.md
docs/authoring/payment-webhook-activation.md
docs/authoring/purchase-grants.md
```

## Boundary

The admin app is a separate app surface and is intended to be deployed behind Cloudflare Access.

The public storefront must not gain an `/admin` route in this commit.

The admin app must not query D1 directly from browser code. D1 access belongs to an Admin API Worker with a Cloudflare D1 binding.

## Non-goals

```txt
No real D1 list queries
No grant revoke/reissue write actions
No Cloudflare Access dashboard automation
No production DNS/route setup
No admin login form
No admin API Worker implementation yet
```

## Next commit

Commit 77 should add the Admin API Worker / D1 Ops Read Model.
