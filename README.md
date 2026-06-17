# VACMS CMS-D1-017A-R2Z-R1W-R4A-F1-R1 repo-root overlay

This archive targets the `earthroon/varuntools` repository root, not the VACMS Worker repository.

## Apply

```powershell
$repo = "D:\11124\dd\varuntools"
$zip = "$env:USERPROFILE\Downloads\VACMS_CMS_D1_017A_R2Z_R1W_R4A_F1_R1_dry_visibility_workflow_early_exit_gate_baked.zip"
Expand-Archive $zip -DestinationPath $repo -Force
cd $repo
```

## Static smoke

```powershell
node .\scripts\cms-d1-017a-r2z-r1w-r4a-f1-r1-workflow-early-exit-static-smoke.mjs `
  --repo "D:\11124\dd\varuntools"
```

## Expected PASS

`PASS_CMS_D1_017A_R2Z_R1W_R4A_F1_R1_DRY_VISIBILITY_WORKFLOW_EARLY_EXIT_GATE_SKIP_CLAIM_EXPORT_MATERIALIZE_PR_FINALIZE_ON_SMOKE_MODE_NO_VACMS_MUTATION_NO_PR`

## Source basis

Fetched current `earthroon/varuntools/.github/workflows/publish-admin-content.yml` with blob SHA `6b5e5142d839639b982c11dfbea57a0c0878475b`, then patched dry visibility step gating only.

## No write during bake

No GitHub write, workflow dispatch, repository dispatch, PR creation, branch creation, or VACMS mutation was performed during bake.
