# Commit 95 — Dedicated portfolio page render components

`feat(markdown): add dedicated portfolio page render components`

Commit 95 adds dedicated Vue render components for portfolio case-study Markdown directives generated from CSV blocks.

## What changed

- Added portfolio render components under `src/components/portfolio/`.
- Registered portfolio directives in the Markdown directive parser/renderer.
- Updated `csv-markdown.mjs` so portfolio CSV blocks emit dedicated directives.
- Added `markdown-portfolio.css` and imported it from `src/main.ts`.
- Added `smoke:portfolio-render-components` and connected it to `check:launch`.

## What did not change

- Related-work slug validation is not enforced yet.
- Lightbox and motion effects were not expanded.
- Existing Vue tone and layout tokens were retained.
- Existing `markdown-box`, `gallery-strip`, and Works collection contracts remain supported.

## SSOT

Portfolio render contract:

```txt
CSV block -> Markdown directive -> Vue component
```

The registry/mounting layer is the render SSOT. CSV remains the authoring SSOT.
