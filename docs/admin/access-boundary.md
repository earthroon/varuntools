# Admin Access Boundary

Commit 76 splits the public storefront from the operator admin surface.

## Protected surface

The admin app is intended to be deployed behind Cloudflare Access.

Recommended protected routes:

```txt
admin.varun.tools/*
admin.varun.tools/api/*
```

If the Admin API Worker is deployed separately, protect both surfaces:

```txt
admin.varun.tools/*
admin-api.varun.tools/*
```

## Access responsibility

Cloudflare Access owns authentication and access policy decisions. The admin app does not implement its own login form in Commit 76.

Allowed identities should be managed in Cloudflare Zero Trust, for example by exact email or an identity provider group. Everyone else should be denied.

## Production blocker

The admin app must not be treated as production-ready unless the Access application is configured. Access 없는 admin은 admin이 아니다.

## Boundary phrase

```txt
Consumer storefront is the shelf.
Admin app is the ledger.
D1 is the vault.
Browser code does not open the vault directly.
```


Write guardrails are separate from Cloudflare Access. Access admits an operator; Admin write guards still require role, confirm phrase, risk level, and audit log readiness.
