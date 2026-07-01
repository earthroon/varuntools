# VT-UI-23R3R1 Adjacent Regex Source Fix

## Verdict

The R3 apply generator emitted regex literals with consumed escape characters inside `src/utils/getAdjacentPublicContentEntries.ts`.

Broken examples:

```ts
.replace(/^https?://[^/]+/i, '')
.replace(/\/g, '/')
.replace(/^/+/, '')
```

R3R1 rewrites the generated source file only. It does not change the SSOT decision from R3.

## PASS markers

```txt
PASS_VT_UI_23R3R1_ADJACENT_REGEX_SOURCE_FIX
```
