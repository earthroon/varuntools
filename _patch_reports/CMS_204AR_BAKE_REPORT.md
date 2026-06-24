# CMS-204AR Bake Report

Patch ID: CMS-204AR

Status: PASS_CMS_204AR_LIVE_DEPLOY_VERIFIED_DIST_REUSE_RELEASE_PAGES_SKIP_PREPARE_SEAL

Implemented:

- Live deploy workflow uses `--skip-prepare`.
- Deploy script preserves existing `skipPrepare` behavior.
- Deploy evidence records `skipPrepare`, `verifiedDistReuse`, source dist hash, copied dist hash, file counts, and byte counts.
- Deploy fails before push if copied dist differs from verified dist.
- No force push introduced.
