# GitHub upload cleanup

This package is the clean source upload version of the Commit 135 bake.

## Included

- App source: `src/`
- Admin app source: `admin/`
- Worker source/contracts: `workers/`
- Static assets: `public/`
- Build/smoke scripts: `scripts/`
- Generated public SEO/search/page inventory outputs: `generated/`, `src/content/generated/page-search-index.json`, etc.
- Project config: `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig*.json`, `index.html`

## Removed from this clean package

- Root `BAKE_REPORT_COMMIT_*.md` history files
- `dist/` build output
- `artifacts/` QA/R2 output
- `_private/` product-file staging area
- `src/content/generated/internal-docs-search-index.json`
- local temp/cache folders

## Notes

This package is intended for a clean GitHub test upload. Some historical smoke scripts in `package.json` may still expect old root bake reports if you run the entire legacy smoke suite. For a practical GitHub import check, start with:

```bash
npm install
npm run validate:content
npm run content:page-inventory
npm run seo:generate
npm run search:generate-public-index
npm run smoke:content-page-inventory
npm run smoke:route-seo-manifest
npm run smoke:sitemap-output
npm run smoke:robots-output
npm run smoke:page-search-public-visibility
npm run build
```

Do not commit `.env`, `.dev.vars`, Cloudflare tokens, or real D1 database IDs.
