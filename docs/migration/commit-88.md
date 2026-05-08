# Commit 88 — CSV Options v2

## Commit

```txt
refactor(csv): support quoted and typed option values
```

## Summary

Commit 88 upgrades the CSV `options` parser while preserving the existing `key=value; key=value` authoring contract.

The parser now supports:

- quoted strings
- escaped delimiters
- bracket arrays
- quoted array items
- typed scalar values
- `null`
- nested keys
- duplicate option diagnostics
- invalid option syntax diagnostics

## Compatibility

Existing syntax remains valid:

```txt
tags=work|design; order=10; featured=true
```

New syntax is recommended when values contain punctuation or prose:

```txt
summary="작업은 느리게; 그러나 정확하게 움직였다"; tags=[work, design, tool]
```

## Diagnostics

Invalid option syntax is an error in both loose and strict modes because the parser cannot safely determine the intended value boundary.

Unknown options remain warnings in loose mode and errors in strict mode.

## SSOT

```txt
Options parser SSOT:
scripts/lib/csv-options.mjs

Option validation integration:
scripts/lib/csv-block-schema.mjs
```

## Verification

```bash
npm run smoke:csv-options
npm run smoke:csv-diagnostics
npm run smoke:csv-authoring
npm run csv:pages
```
