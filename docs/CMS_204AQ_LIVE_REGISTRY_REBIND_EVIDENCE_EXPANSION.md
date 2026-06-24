# CMS-204AQ

Live Registry Rebind Evidence Expansion / Post Build Bundle Candidate Audit Seal

## Scope

- Expands `vacms-live-markdown-registry-source-rebind.json` with generated module evidence.
- Expands `vacms-page-registry-receipt.json` with full dist JS bundle candidate audit.
- Preserves deploy blocking when `materializedSlug` is not proven in a runtime registry owner bundle.
- Does not patch `dist` assets manually.

## Pass Policy

`materializedSlug` may pass if it appears in a named registry candidate chunk or in an unknown runtime chunk that also contains a registry ownership token.

SearchPage, sitemap, and search-index hits alone remain failures.
