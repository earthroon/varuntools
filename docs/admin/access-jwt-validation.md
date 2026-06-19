# Access JWT Validation

Cloudflare Access JWT handling is sealed at the signature verification boundary.

The admin API must verify `Cf-Access-Jwt-Assertion` with the Access JWKS endpoint before trusting the identity payload. Payload shape is not identity. Signature is identity.

## Required failure codes

- `ACCESS_SIGNATURE_INVALID`
- `ACCESS_CERTS_UNAVAILABLE`
- `ACCESS_ISSUER_MISMATCH`
- `ACCESS_AUD_MISMATCH`
- `ACCESS_TOKEN_EXPIRED`
- `ACCESS_TOKEN_NOT_ACTIVE`
- `ACCESS_EMAIL_NOT_ALLOWED`

## Contract

- JWKS are loaded from `/cdn-cgi/access/certs`.
- Only RS256 signatures are accepted.
- Audience membership must include the configured Access audience.
- Email allowlist comparison is lowercase-normalized.
