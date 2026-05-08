# Commit 89 — Portfolio case-study CSV blocks

Commit 89 adds portfolio-oriented CSV blocks on top of the schema and diagnostics pipeline from Commit 87 and the options v2 parser from Commit 88.

## Commit

```txt
feat(csv): add portfolio case-study blocks
```

## Added blocks

```txt
portfolio-hero
work-summary
role-stack
problem
solution
process
decision
result
metric
tool-stack
quote
case-gallery-start
case-gallery-item
case-gallery-end
related-works
```

## Rendering policy

Commit 89 intentionally reuses known Markdown directives instead of adding new Vue directive wiring.

- Narrative blocks render through `markdown-box`.
- Case galleries render through `gallery-strip`.
- Quote blocks render as Markdown blockquotes.

This keeps content validation stable while allowing CSV-authored case-study structure.

## Diagnostics

The new blocks are registered in `CSV_BLOCK_SCHEMAS`, so required fields, recommended fields, `requiresOneOf`, allowed options, and case-gallery group structure are validated before Markdown is generated.

## Verification

```bash
npm run smoke:csv-portfolio-blocks
npm run smoke:csv-options
npm run smoke:csv-diagnostics
npm run smoke:csv-authoring
npm run csv:pages
```
