# CMS-204AS Live Materialized Source Commit Back

This patch persists the live materialized markdown source into `main` before building and deploying the verified `dist` output.

## Contract

- The generated source path must be `src/content/pages/**/index.md`.
- The workflow commits only the exact generated source path.
- The workflow pushes the source commit to `origin/main` before build.
- Deploy evidence records the source commit receipt.
- Finalize requires both source commit evidence and gh-pages deploy evidence.
- `release:pages` remains `--skip-prepare` in live branch apply mode.

## Runtime receipts

- `vacms-source-commit-receipt.json`
- `vacms-pages-deploy-evidence.json`
- `vacms-live-deploy-receipt.json`
- `vacms-live-finalize.json`
