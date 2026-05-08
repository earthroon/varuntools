# Commit 19 — BeforeAfter Natural Ratio / Legacy Marker Adapter

## SSOT

- Final authoring SSOT is `::before-after`.
- Legacy `[전]` / `[후]` marker syntax is migration input only.
- Runtime DOM crawling is not allowed.

## Implemented

- `BeforeAfterWiper.vue` reads the before image natural size and seals the stage aspect ratio with `--ba-aspect-ratio`.
- before/after missing assets render an explicit failure block instead of a half-working slider.
- `legacyBeforeAfterAdapter.ts` converts safe source patterns before markdown-it renders HTML.
- Validation checks before-after directives and warns about unsupported legacy marker residue.

## Supported legacy patterns

```md
![before](./images/before.webp)
[전]

![after](./images/after.webp)
[후]
```

```md
![before](./images/before.webp "[전]")
![after](./images/after.webp "[후]")
```

## Unsupported

- Notion/Super column DOM matching.
- Guessing distant images.
- One before image matched to many after images.
- Silent correction.
