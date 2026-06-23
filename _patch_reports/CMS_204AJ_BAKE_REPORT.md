# CMS-204AJ Bake Report R1

## Patch

Public Workflow Frontmatter YAML Array Preservation / Materializer Tags Array Seal

## R1 reason

Initial guard failed because it required `npm run validate:content` as a literal workflow line. The workflow intentionally calls `npm run build`; the public repo `package.json` build script owns `npm run validate:content`. R1 changes guard evidence to read `package.json`.

## Expected status

PASS_CMS_204AJ_PUBLIC_WORKFLOW_FRONTMATTER_YAML_ARRAY_PRESERVATION_MATERIALIZER_TAGS_ARRAY_SEAL

## Files

- `.github/workflows/publish-admin-content.yml`
- `scripts/cms-204aj-public-workflow-frontmatter-yaml-array-preservation-guard.mjs`
- `docs/CMS_204AJ_PUBLIC_WORKFLOW_FRONTMATTER_YAML_ARRAY_PRESERVATION.md`
- `_patch_reports/CMS_204AJ_BAKE_REPORT.md`
- `artifacts/cms/CMS_204AJ_PUBLIC_WORKFLOW_FRONTMATTER_YAML_ARRAY_PRESERVATION.json`
