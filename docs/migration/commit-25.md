# Commit 25 — Content Asset Registry

## Rule

All content asset paths must be resolved through `src/content/assetRegistry.ts` at runtime and `scripts/lib/asset-registry.mjs` in Node validation/audit tooling.

## Supported sources

- `./images/foo.webp` — content-relative local asset
- `/assets/foo.webp` or `/og-default.svg` — public asset
- `https://example.com/foo.webp` — external asset, allowed but auditable
- `data:image/...` — data URL, allowed but auditable

## Safety

- Paths escaping `src/content/pages` are invalid.
- Missing local assets must not be silently replaced.
- Runtime and validation must use the same source classification rules.
- Missing display fallbacks are UI states, not pretend assets.

## Commands

```bash
npm run audit:assets
npm run smoke:assets
npm run validate:content
```
