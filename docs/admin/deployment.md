# Admin Deployment Notes

Commit 76 adds a separate admin app surface. It is not part of the public storefront build.

## Local commands

```bash
npm run admin:dev
npm run admin:build
npm run admin:preview
```

These commands run inside the `admin/` app via npm prefix.

## Domain candidate

```txt
admin.varun.tools
```

## Cloudflare Access

Before production use, configure a Cloudflare Access application for:

```txt
admin.varun.tools/*
```

If the API is deployed as a separate hostname, also protect:

```txt
admin-api.varun.tools/*
```

## Admin API

Commit 76 only includes an Admin API client stub. Commit 77 should add an Admin API Worker or Pages Function that checks Access context and queries D1 through a Worker binding.

## Deployment options

Candidate options:

```txt
Cloudflare Pages for admin static app
Cloudflare Worker static assets for admin app
Admin API Worker under admin.varun.tools/api/*
Separate Admin API Worker under admin-api.varun.tools/*
```

No option is finalized in Commit 76.

## Commit 78 deployment note

The ops ledger pack adds documentation and read-only admin routes only.
