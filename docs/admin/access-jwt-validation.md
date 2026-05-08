# Access JWT Validation

Commit 81 changes the Admin API boundary from payload-only JWT parsing to Worker-side Cloudflare Access signature verification.

## SSOT

```txt
Admin authentication SSOT = workers/admin-api/src/access.ts
External signing key SSOT = ACCESS_TEAM_DOMAIN/cdn-cgi/access/certs
```

## Required request header

```txt
Cf-Access-Jwt-Assertion: <Cloudflare Access application JWT>
```

The `CF_Authorization` cookie alone is not accepted by the Admin API Worker.

## Required environment

```txt
ACCESS_TEAM_DOMAIN=https://<team>.cloudflareaccess.com
ACCESS_AUD=<Cloudflare Access application audience tag>
ACCESS_ALLOWED_EMAILS=owner@example.com,ops@example.com
```

`ACCESS_ALLOWED_EMAILS` is optional. When present, it is normalized with trim + lowercase and checked after the JWT signature, issuer, audience, and time claims pass.

## Verification sequence

```txt
1. Require Cf-Access-Jwt-Assertion.
2. Require ACCESS_TEAM_DOMAIN and ACCESS_AUD.
3. Decode JWT header/payload only to find alg, kid, and claims.
4. Require alg=RS256 and kid.
5. Fetch and cache Cloudflare Access signing keys from /cdn-cgi/access/certs.
6. Select candidate keys by kid.
7. Verify RS256 signature with WebCrypto.
8. Require iss to match normalized ACCESS_TEAM_DOMAIN.
9. Require aud list to include ACCESS_AUD.
10. Require exp to be present and future.
11. Reject nbf claims in the future.
12. Require email or sub.
13. Enforce ACCESS_ALLOWED_EMAILS when configured.
```

## Failure codes

| Code | Status | Meaning |
|---|---:|---|
| `ACCESS_TOKEN_MISSING` | 401 | Missing `Cf-Access-Jwt-Assertion`. |
| `ADMIN_API_NOT_CONFIGURED` | 501 | Missing `ACCESS_TEAM_DOMAIN` or `ACCESS_AUD`. |
| `ACCESS_TOKEN_INVALID` | 401 | JWT format or required expiry is invalid. |
| `ACCESS_HEADER_INVALID` | 401 | JWT does not use `RS256` or is missing `kid`. |
| `ACCESS_CERTS_UNAVAILABLE` | 503 | Cloudflare Access certs/JWKS endpoint could not be read. |
| `ACCESS_SIGNATURE_INVALID` | 401 | Signature verification failed. |
| `ACCESS_ISSUER_MISMATCH` | 403 | `iss` does not match `ACCESS_TEAM_DOMAIN`. |
| `ACCESS_AUD_MISMATCH` | 403 | `aud` does not include `ACCESS_AUD`. |
| `ACCESS_TOKEN_EXPIRED` | 401 | `exp` is in the past. |
| `ACCESS_TOKEN_NOT_ACTIVE` | 401 | `nbf` is in the future. |
| `ACCESS_IDENTITY_MISSING` | 403 | Token has neither `email` nor `sub`. |
| `ACCESS_EMAIL_NOT_ALLOWED` | 403 | Email is not in `ACCESS_ALLOWED_EMAILS`. |

## Boundary phrase

```txt
Access admits an identity only when the token is signed, current, audience-bound, issuer-bound, and allowlisted.
Payload shape is not identity. Signature is identity.
```
