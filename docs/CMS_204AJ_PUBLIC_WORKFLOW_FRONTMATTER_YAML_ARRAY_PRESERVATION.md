# CMS-204AJ Public Workflow Frontmatter YAML Array Preservation

## SSOT

`earthroon/varuntools/.github/workflows/publish-admin-content.yml` materializes VACMS export payload into public markdown. The prior materializer converted every frontmatter value with `String(value)`, flattening arrays such as `tags: ["sdsds"]` into scalar YAML such as `tags: "sdsds"`.

## Patch

CMS-204AJ patches the workflow materializer to:

- normalize `frontmatter.tags` into `string[]` after frontmatter merge,
- render empty arrays as `tags: []`,
- render arrays as YAML sequences,
- preserve scalar rendering for non-array fields,
- keep `npm run build` in the workflow path,
- verify `validate:content` through `package.json` instead of requiring a literal workflow line.

## R1 fix

The first guard looked for `npm run validate:content` directly in `.github/workflows/publish-admin-content.yml`. In the public repo, validation is nested under the package `build` script, so R1 reads `package.json` and accepts the existing contract:

```txt
workflow: npm run build
package build: npm run validate:content && ...
validate:content: node scripts/validate-content.mjs
```

## Non-goals

- Do not patch generated public pages manually.
- Do not loosen public validation.
- Do not bypass `npm run build`.
- Do not mutate VACMS Worker code.
