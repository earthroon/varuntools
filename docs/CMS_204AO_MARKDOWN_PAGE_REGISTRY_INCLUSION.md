# CMS-204AO-R2

## Markdown Page Registry Owner Bundle Guard Fix

CMS-204AO-R2 fixes the registry seal target.

The runtime markdown registry can be owned by `useRouteManifest-*.js`, while `pageLookup-*.js` may only import that owner bundle. Therefore a direct `pageLookup-*.js` string check is too narrow.

Accepted runtime bundle evidence:

- `dist/assets/useRouteManifest-*.js` contains the materialized slug
- or `dist/assets/pageLookup-*.js` contains the materialized slug
- or a non-SearchPage JavaScript chunk contains the materialized slug

Rejected evidence:

- `dist/sitemap.xml` only
- `dist/search-index.json` only
- `dist/assets/SearchPage-*.js` only

The workflow still blocks before gh-pages deploy if the live materialized route is missing from the runtime registry owner bundle.
