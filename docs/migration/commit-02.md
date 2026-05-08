# Commit 02 — Extended Markdown Directive Parser

## 0. Purpose

Commit 02 connects VARUNTOOLS Extended Markdown v0 directives to the `markdown-it` rendering pipeline.

Commit 01 defined the Markdown SSOT and documented directive syntax. Commit 02 parses directive blocks and emits stable custom element placeholders. It does **not** mount Vue components yet.

## 1. Scope

Implemented directives:

- `::video` -> `<varun-video>`
- `::before-after` -> `<before-after-wiper>`
- `::image-card` -> `<image-card>`
- `::note` / `::warning` / `::tip` -> `<callout-box>`

## 2. SSOT

```txt
Markdown source:
src/content/pages/**/index.md

Renderer registration:
src/markdown/createMarkdownRenderer.ts

Directive parser:
src/markdown/directiveParser.ts

Directive renderers:
src/markdown/directives/*.ts
```

## 3. Parser contract

```txt
::directive-name
key: value
key2: true
body line
::
```

Rules:

- opening line must be `::name`
- closing line must be `::`
- `key: value` lines become attrs
- `true` / `false` become booleans
- numeric strings become numbers
- non-attribute lines become body
- unknown or broken directives are not silently fixed

## 4. Validation

### `::video`

Required:

- `src`

Optional:

- `fallback`
- `poster`
- `caption`
- `autoplay`
- `loop`
- `muted`
- `playsinline`
- `controls`

### `::before-after`

Required:

- `before`
- `after`

Optional:

- `caption`
- `initial`

### `::image-card`

Required:

- `src`

Optional:

- `alt`
- `caption`
- `tag`
- `href`

### `::note`, `::warning`, `::tip`

Required:

- body text or `title`

## 5. Output policy

Commit 02 outputs custom element placeholders only.

Example:

```md
::before-after
before: ./images/before.svg
after: ./images/after.svg
caption: comparison
initial: 50
::
```

renders as:

```html
<before-after-wiper data-before="./images/before.svg" data-after="./images/after.svg" data-caption="comparison" data-initial="50"></before-after-wiper>
```

## 6. Security policy

- `markdown-it` still uses `html: false`
- directive body text is escaped before rendering
- directive attribute values are escaped
- attribute names are normalized to safe `data-*` names
- remote Markdown loading remains out of scope

## 7. Deferred

Commit 02 intentionally does not implement:

- Vue component mounting
- real video player behavior
- real before/after slider behavior
- real image card component behavior
- legacy `[전]` / `[후]` Super DOM parser
- asset URL resolving or importing

## 8. Next commit

```txt
Commit 03 — Markdown Custom Element Vue Mount Bridge
```

Commit 03 should find the generated custom elements in `MarkdownPage`, read `data-*` attributes, mount Vue components, and cleanly unmount them on route/content changes.
