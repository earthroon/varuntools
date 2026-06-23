# CMS-204AK R1 Bake Report

## Patch

```txt
CMS-204AK
Public Workflow Frontmatter Object Serialization Guard /
No Object Object Leak Seal
```

## R1 Fix

- Guard now checks the indirect `check:launch` route through `scripts/release-prepare.mjs`.
- Apply script prints the receipt path when guard fails.
- Core workflow patch remains idempotent.

## Expected Receipt

```txt
artifacts/cms/CMS_204AK_PUBLIC_WORKFLOW_FRONTMATTER_OBJECT_SERIALIZATION_GUARD.json
```

Expected status:

```txt
PASS_CMS_204AK_PUBLIC_WORKFLOW_FRONTMATTER_OBJECT_SERIALIZATION_GUARD_NO_OBJECT_OBJECT_LEAK_SEAL
```


## R2 note

Guard now accepts the CMS-204AJ string-concat YAML array renderer as well as template-literal renderers. This fixes the false failure on `yaml_entry_array_branch_preserved`.
