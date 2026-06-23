# CMS-204AK R1 - Public Workflow Frontmatter Object Serialization Guard

## Status

PASS target:

```txt
PASS_CMS_204AK_PUBLIC_WORKFLOW_FRONTMATTER_OBJECT_SERIALIZATION_GUARD_NO_OBJECT_OBJECT_LEAK_SEAL
```

## R1 Change

The first guard treated `check:launch` as missing when it was invoked indirectly through `scripts/release-prepare.mjs` from `npm run deploy:pages`. R1 keeps the same workflow patch and updates the guard to inspect `package.json`, `scripts/release-prepare.mjs`, and `scripts/deploy-pages-branch.mjs` instead of relying only on a direct package script string.

## Patch Contract

- Preserve CMS-204AJ YAML array rendering for `tags`.
- Prevent `[object Object]` leaks by serializing plain objects as JSON string scalars.
- Do not bypass `validate:content`, `check:launch`, or `npm run build`.
- Do not manually patch generated content pages.
- Do not mutate VACMS Worker code.


## R2 note

Guard now accepts the CMS-204AJ string-concat YAML array renderer as well as template-literal renderers. This fixes the false failure on `yaml_entry_array_branch_preserved`.
