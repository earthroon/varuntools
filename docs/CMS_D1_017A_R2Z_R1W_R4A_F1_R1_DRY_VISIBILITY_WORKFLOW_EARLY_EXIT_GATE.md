# CMS-D1-017A-R2Z-R1W-R4A-F1-R1 Dry Visibility Workflow Early Exit Gate

## Patch ID

`CMS-D1-017A-R2Z-R1W-R4A-F1-R1`

## Purpose

Patch `earthroon/varuntools` workflow `.github/workflows/publish-admin-content.yml` so `publish_mode = cms-dispatch-visibility-smoke` cannot reach VACMS claim/export/materialize/PR/finalize stages.

## Fixed failure evidence

R4A-F1 observed the selected `workflow_dispatch` run reaching `Claim VACMS publish job` while `PUBLISH_MODE = cms-dispatch-visibility-smoke`. That violates the dry visibility contract.

## Contract

In dry visibility mode:

- claim: skipped
- export: skipped
- materialize: skipped
- checkout/public repo mutation path: skipped
- branch/commit/push: skipped
- draft PR: skipped
- published finalize: skipped
- failure finalize: skipped
- dry visibility artifact: uploaded

## Static validation

From the varuntools repo root after applying this overlay:

```powershell
node .\scripts\cms-d1-017a-r2z-r1w-r4a-f1-r1-workflow-early-exit-static-smoke.mjs `
  --repo "D:\11124\dd\varuntools"
```

Expected status:

`PASS_CMS_D1_017A_R2Z_R1W_R4A_F1_R1_DRY_VISIBILITY_WORKFLOW_EARLY_EXIT_GATE_SKIP_CLAIM_EXPORT_MATERIALIZE_PR_FINALIZE_ON_SMOKE_MODE_NO_VACMS_MUTATION_NO_PR`

## Live validation

After committing this workflow patch to `earthroon/varuntools`, re-run VACMS R4-LIVE-R1A dispatch smoke, then R4A and R4A-F1. Expected GitHub Actions result:

- workflow conclusion: success
- dry visibility artifact exists
- claim/export/materialize/PR/finalize steps are skipped

## Boundaries

This patch does not modify VACMS Worker source, VACMS D1, Cloudflare secrets, generated content, or any GitHub token value.
