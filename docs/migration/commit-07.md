# Commit 07 — Markdown Section Gap / Layout Directives

## Purpose

Commit 07 adds Markdown-native layout directives for visual breathing room and section separation.

This replaces the direction of the old Super/Notion `[문단끝]` DOM scanner with explicit Markdown SSOT directives.

## Scope

- Add `section-gap` and `section-break` to directive names.
- Render `::section-gap` to `<section-gap>`.
- Render `::section-break` to `<section-break>`.
- Mount those custom elements to Vue components.
- Add `SectionGap.vue` and `SectionBreak.vue`.
- Add `markdown-layout.css`.
- Add sample usage to Markdown content.

## Not in scope

- No legacy `[문단끝]` DOM scanner port.
- No Super/Notion runtime port.
- No MutationObserver-based layout post-processing.
- No nested `::section` wrapper directive.
- No VENOM NAV, Lightbox, Tooltip, Pagecard, or Featured Works ports.

## Directive grammar

### Section gap

```md
::section-gap
size: lg
::
```

Allowed sizes:

```txt
sm / md / lg / xl
```

Explicit height is also supported:

```md
::section-gap
height: 96
::
```

Height is clamped between 12px and 240px.

### Section break

```md
::section-break
label: Works
tone: accent
::
```

Allowed tones:

```txt
quiet / accent / ink
```

## SSOT

```txt
Layout directive parser:
src/markdown/directives/sectionGapDirective.ts
src/markdown/directives/sectionBreakDirective.ts

Layout components:
src/components/markdown/SectionGap.vue
src/components/markdown/SectionBreak.vue

Layout styles:
src/styles/markdown-layout.css
```

## Accessibility

`SectionGap` and `SectionBreak` are visual layout devices and render as `aria-hidden="true"`.

If the label should be semantically meaningful, use a Markdown heading instead of `section-break label`.

## Completion criteria

```txt
- DirectiveName includes section-gap and section-break.
- directive parser recognizes section-gap and section-break.
- sectionGapDirective.ts exists.
- sectionBreakDirective.ts exists.
- directives/index.ts dispatches both layout directives.
- SectionGap.vue exists.
- SectionBreak.vue exists.
- mountMarkdownComponents.ts mounts both custom elements.
- markdown-layout.css exists and is imported by main.ts.
- sample Markdown includes layout directive examples.
- extended-markdown-v0.md documents layout directives.
- legacy [문단끝] scanner remains out of scope.
```

## Next likely commit

Commit 08 should likely be `Legacy Section Gap Adapter`, which can translate old `[문단끝]` content into the new Markdown-native section spacing model without restoring the old DOM scanner as the main path.
