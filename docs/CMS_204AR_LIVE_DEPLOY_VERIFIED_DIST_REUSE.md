# CMS-204AR

## Live Deploy Verified Dist Reuse / Release Pages Skip Prepare Seal

CMS-204AR prevents live publish deploy from rebuilding after CMS-204AQ has verified the runtime registry bundle.

The live branch apply deploy step must call:

```bash
npm run release:pages -- --push --skip-prepare
```

The deploy script records the source dist hash and copied deploy worktree hash in `vacms-pages-deploy-evidence.json`.

Deploy must fail before push if the dist copied to the deploy worktree differs from the dist that AQ/AO already verified.
