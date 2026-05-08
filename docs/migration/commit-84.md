# Commit 84 — Restore admin and worker verification gates

## Commit

`chore(build): restore admin and worker verification gates`

## Purpose

Commit 81, 82, and 83 sealed three security boundaries:

1. Admin API Cloudflare Access JWT signature verification
2. Authenticated payment webhook ingress
3. Atomic download grant consumption

Commit 84 makes those boundaries part of the launch verification gate so regressions are visible instead of silently drifting.

## Changes

- Added `admin/src/vite-env.d.ts` so the admin Vue app can type-check `import.meta.env` usage through Vite's client types.
- Added root-level verification scripts:
  - `admin-api:typecheck`
  - `delivery:check`
  - `check:workers`
  - `check:admin`
  - `check:security-smoke`
  - `check:security-core`
- Wired the Commit 81 security smoke into `scripts/check-launch.mjs`:
  - `smoke:admin-access-signature`
- Wired the Commit 83 security smoke into `scripts/check-launch.mjs`:
  - `smoke:download-grant-consume`
- Added admin and worker verification gates to `scripts/check-launch.mjs`:
  - `admin:build`
  - `admin-api:typecheck`
  - `delivery:check`

## Verification SSOT

`package.json` and `scripts/check-launch.mjs` are the verification SSOT.

## Runtime scope

No runtime store/admin/delivery behavior was changed in this commit.

## Expected commands

```bash
npm run check:security-smoke
npm run check:workers
npm run check:admin
npm run check:security-core
npm run check:launch
```

## Notes

`check:admin` and `check:launch` require the admin build dependencies to be installed. In a fresh extracted ZIP with no `node_modules`, `vue-tsc`/`vite` may be unavailable until dependencies are installed.
