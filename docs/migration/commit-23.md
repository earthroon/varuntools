# Commit 23 Migration Audit / Codemod

Commit 23 adds read-only audit and opt-in codemod tools for old Markdown migration syntax.

## Audit

```bash
npm run audit:legacy
```

## Check conversion

```bash
npm run codemod:legacy
```

## Write conversion

```bash
npm run codemod:legacy:write
```

## Safety rules

- `--check` is the default mode.
- No source file is modified without `--write`.
- Files with warnings are not modified even in `--write` mode.
- Ambiguous legacy syntax remains for manual review.
- The CLI uses the same adapter order as the runtime migration path: section gap, before-after, pagecard, markdown-box.
