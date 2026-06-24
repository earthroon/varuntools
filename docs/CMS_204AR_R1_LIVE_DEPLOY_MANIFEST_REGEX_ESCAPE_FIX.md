# CMS-204AR-R1

Live Deploy Dist Manifest Windows Regex Escape Fix / Node Syntax Guard Seal

## Scope

Fixes the malformed regex literal emitted by the CMS-204AR apply script in `scripts/deploy-pages-branch.mjs`.

The intended source is:

```js
.replace(/\\/g, '/')
```

The failed emitted source was syntactically invalid:

```js
.replace(/\/g, '/')
```

## Guard

`node --check scripts/deploy-pages-branch.mjs` must pass before the patch passes.
