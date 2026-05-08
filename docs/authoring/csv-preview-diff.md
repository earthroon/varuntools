# CSV Preview / Diff / Check

Commit 91 adds observation modes to the CSV authoring CLI.

## Modes

| Mode | Writes `index.md` | Purpose |
|---|---:|---|
| `--preview` | No | Print generated Markdown |
| `--dry-run` | No | Compatibility alias for `--preview` |
| `--diff` | No | Compare current `index.md` with generated Markdown |
| `--check` | No | CI stale-output gate |
| `--report` | No | Print block/diagnostic summary |
| default | Yes | Generate/write Markdown |
| `--write` | Yes | Write even when observation modes are used |

## CI stale check

Use `--check` to detect when `page.csv` and `index.md` are out of sync.

```bash
npm run csv:page -- src/content/pages/works/project-name/page.csv --check
```

A changed output exits with code `1` and prints a stale output message.

## Diff output

The diff is dependency-free and line-based. It is intentionally compact, not a full Git diff engine.

```bash
npm run csv:page -- src/content/pages/works/project-name/page.csv --diff
```

## Report output

```bash
npm run csv:page -- src/content/pages/works/project-name/page.csv --report
```

Reports include:

- source path
- output path
- row count
- changed state
- current/generated lengths
- block counts
- diagnostics counts
- diagnostic details when present

## Failure policy

Diagnostics errors abort all modes and do not write output.

`--check` fails when the generated Markdown differs from the current `index.md`.

## Asset summary in reports

After Commit 93, `--report` includes an `assets` section showing how many local, public, and external references were checked, and how many asset warnings or errors were produced.

```txt
assets:
- checked: 12
- local: 10
- public: 1
- external: 1
- missing: 0
- warnings: 2
- errors: 0
```
