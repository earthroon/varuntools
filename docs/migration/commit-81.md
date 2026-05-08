# Commit 81 — Admin API Access JWT Signature Verification

## Commit

```txt
fix(admin-api): verify cloudflare access jwt signature
```

## Scope

This commit hardens the Admin API authentication boundary only. It does not enable runtime write actions, Toss webhook authentication, or atomic download grant consumption.

## Changed files

```txt
workers/admin-api/src/access.ts
workers/admin-api/src/types.ts
workers/admin-api/src/db.ts
docs/admin/access-jwt-validation.md
scripts/smoke-admin-access-signature.mjs
workers/admin-api/src/worker-runtime.d.ts
workers/admin-api/tsconfig.json
package.json
BAKE_REPORT_COMMIT_81.md
```

## Security change

Before this commit, the Admin API decoded the Access JWT payload and checked `aud`, `exp`, and email allowlist without verifying the token signature.

After this commit, the Worker verifies the `Cf-Access-Jwt-Assertion` token with Cloudflare Access signing keys from:

```txt
ACCESS_TEAM_DOMAIN/cdn-cgi/access/certs
```

The verification sequence is:

```txt
RS256 header + kid
Cloudflare Access certs/JWKS fetch/cache
WebCrypto RSASSA-PKCS1-v1_5 SHA-256 signature verification
issuer match
requested audience match
exp/nbf time claim check
email/sub identity check
optional email allowlist
```

## SSOT

```txt
Admin authentication SSOT = workers/admin-api/src/access.ts
```

## Runtime result

Forged payload-only tokens are now rejected with `ACCESS_SIGNATURE_INVALID` before any D1 read model route can execute.

## Read-model type alignment

`workers/admin-api/src/db.ts` now returns `variantId`, `bundleId`, and `licenseScope` as `null` for the current grant list query so the existing `AdminGrantSummary` contract typechecks. This does not add any runtime write path.
