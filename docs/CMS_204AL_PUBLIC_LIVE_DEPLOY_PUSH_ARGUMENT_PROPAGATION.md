# CMS-204AL Public Live Deploy Push Argument Propagation

## SSOT

`publish-admin-content.yml` previously invoked `npm run deploy:pages -- --push`. The `deploy:pages` script wraps `release:pages`, so the final `deploy-pages-branch.mjs` script did not reliably receive `--push`.

## Seal

CMS-204AL requires the workflow to call `npm run release:pages -- --push` directly, writes `vacms-pages-deploy-evidence.json` from the deploy script, and blocks success finalize unless the evidence says `pushed: true` and remote `gh-pages` SHA readback succeeds.

## Non-goals

- No generated page manual patch.
- No VACMS Worker mutation.
- No build/check bypass.
- No validation weakening.
