# Launch validation

Commit 98 makes launch validation explicit instead of allowing dependency failures to appear later as vague missing-package errors.

## Commands

```bash
npm ci
npm run check:deps
npm run validate:content
npm run check:launch
```

## Runtime contract

`check:launch` now starts with a dependency runtime preflight. It verifies:

- `package-lock.json` exists.
- required runtime dependencies are declared in `package.json`.
- required packages exist in `node_modules`.
- `vite` and `vue-tsc` binaries exist before build/typecheck steps run.

If dependencies are missing, `check:launch` stops at `check:deps` and prints the exact missing packages instead of failing later inside `validate:content`, `vue-tsc`, or `vite build`.

## Groups

The launch gate is grouped into:

1. dependency runtime
2. content authoring
3. security/workers
4. build/release

Each step prints a pass/fail line and the final summary reports passed, failed, and timed-out counts.

## Important

This does not replace dependency installation. A release environment still needs `npm ci` before `npm run check:launch`.
