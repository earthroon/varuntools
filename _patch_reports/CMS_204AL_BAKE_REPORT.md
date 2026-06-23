# CMS-204AL Bake Report

Patch ID: CMS-204AL

Status target:

```txt
PASS_CMS_204AL_PUBLIC_LIVE_DEPLOY_PUSH_ARGUMENT_PROPAGATION_RELEASE_PAGES_PUSH_SEAL
```

Implemented:

- Workflow live deploy step calls `npm run release:pages -- --push` directly.
- Deploy script writes `vacms-pages-deploy-evidence.json`.
- Finalize step requires push evidence and non-empty `gh-pages` deploy SHA.
- Finalize receipt includes `deployPushed` and `deployEvidence`.
- Success finalize sends non-null `commitSha`.
