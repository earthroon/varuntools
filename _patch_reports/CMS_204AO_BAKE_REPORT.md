# CMS-204AO-R1 Bake Report

## Patch

CMS-204AO — Markdown Page Registry Inclusion For Live Materialized Route / Page Lookup Bundle Seal

## Baked artifacts

- `CMS_204AO_APPLY_LOCAL.ps1`
- `patch_payload/apply-cms-204ao.mjs`
- `patch_payload/scripts/cms-204ao-markdown-page-registry-inclusion-guard.mjs`
- `patch_payload/docs/CMS_204AO_MARKDOWN_PAGE_REGISTRY_INCLUSION.md`
- `patch_payload/_patch_reports/CMS_204AO_BAKE_REPORT.md`

## Expected static receipt

```txt
artifacts/cms/CMS_204AO_MARKDOWN_PAGE_REGISTRY_INCLUSION.json
```

## PASS

```txt
PASS_CMS_204AO_R1_MARKDOWN_PAGE_REGISTRY_INCLUSION_GUARD_FIX_SEAL
```

## Guard policy

The guard passes only when the built page lookup bundle contains the live materialized slug. Search index or sitemap inclusion alone is treated as insufficient evidence.


## R1 note

R1 narrows the no-force-push static guard to actual `git push` commands only. Cleanup commands such as `git worktree remove --force` are not treated as force pushes.
