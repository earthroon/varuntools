# CMS-207M-R1A-R1 Windows argv integrity

Patch identity:

`CMS-207M-R1A-R1 / WINDOWS-GIT-ARGV-INTEGRITY / NO-CMD-SHELL-ARGUMENT-REPARSE / SAME-PAGE-REVISION-REPLACEMENT-PRESERVED`

## Runtime failure closed

On Windows, the R1A source-commit helper used `spawnSync(..., { shell: process.platform === 'win32' })` while also passing a structured argv array.

For the commit call:

```text
git commit -m "publish: persist VACMS page lab/alpha"
```

Node's Windows shell path reparsed the commit message so Git observed the words after `-m` as pathspecs. The witnessed failure was:

```text
error: pathspec 'persist' did not match any file(s) known to git
error: pathspec 'VACMS' did not match any file(s) known to git
error: pathspec 'page' did not match any file(s) known to git
error: pathspec 'lab/alpha' did not match any file(s) known to git
```

## Fix

All Git child-process calls in `scripts/commit-vacms-materialized-source.mjs` now use direct argv execution with `shell: false`.

The patch does not alter page identity, revision replacement, predecessor retirement, path ownership, projection parity, D1, R2, or WASM semantics.

## Invariants

- Git command arguments remain separate argv elements.
- Commit messages containing spaces remain one `-m` value.
- No `cmd.exe` or PowerShell quoting layer is introduced by the source-commit helper.
- Same-page route-move deletion and current snapshot addition remain one Git commit.
- Existing R1A fail-closed projection checks remain unchanged.
