# Commit 12 - Shared Markdown Document View

## Purpose

Commit 12 consolidates Markdown document rendering into a single shared view component.

Before this commit, `MarkdownPage.vue`, `HomePage.vue`, and `WiperPage.vue` each carried parts of the same document rendering flow: Markdown HTML output, directive component mounting, TOC state, active heading tracking, and related work footer rendering.

After this commit, that shared responsibility belongs to `MarkdownDocumentView.vue`.

## Scope

- Add `src/components/markdown/MarkdownDocumentView.vue`.
- Add `src/markdown/pageLookup.ts`.
- Stabilize `src/markdown/useMarkdownComponentMount.ts` around an options object.
- Reduce `MarkdownPage.vue` to a route wrapper.
- Reduce `HomePage.vue` to a `home` slug wrapper.
- Reduce `WiperPage.vue` to a `tools/wiper` slug wrapper.
- Keep `WorksPage.vue` as a collection app page, not a Markdown document wrapper.
- Add `src/styles/markdown-document.css` for shared document states.
- Import `markdown-document.css` from `main.ts`.

## SSOT

```txt
Markdown document rendering SSOT:
src/components/markdown/MarkdownDocumentView.vue

Slug lookup SSOT:
src/markdown/pageLookup.ts

Directive mount SSOT:
src/markdown/useMarkdownComponentMount.ts
src/markdown/mountMarkdownComponents.ts

Active heading SSOT:
src/composables/useActiveHeading.ts

Related footer SSOT:
src/markdown/pageRegistry.ts
src/components/works/WorkDetailFooter.vue
```

## MarkdownDocumentView responsibilities

```txt
MarkdownDocumentView.vue
├─ renders page.html with v-html
├─ owns markdownRoot ref
├─ mounts Markdown directive components
├─ refreshes active heading state after mount
├─ renders MarkdownToc
├─ renders WorkDetailFooter when enabled
├─ renders shared not-found state
└─ performs cleanup/remount through useMarkdownComponentMount
```

## Page wrapper policy

### MarkdownPage.vue

`MarkdownPage.vue` now only reads the route slug and passes the located page into `MarkdownDocumentView`.

### HomePage.vue

`HomePage.vue` now renders the `home` page through `MarkdownDocumentView` with `showRelatedFooter=false`.

### WiperPage.vue

`WiperPage.vue` now renders the `tools/wiper` page through `MarkdownDocumentView`.

### WorksPage.vue

`WorksPage.vue` remains a collection page. It is not folded into `MarkdownDocumentView` because it is an app-like index page rather than a Markdown document page.

## Slug lookup policy

```txt
normalizePageSlug()
├─ joins array route params with /
├─ strips leading/trailing slashes
├─ falls back to home for empty slugs
└─ never guesses similar slugs

findMarkdownPageBySlug()
├─ exact slug match only
└─ returns null when missing
```

No silent correction is allowed. `tool/wiper` does not resolve to `tools/wiper` unless the slug is exact.

## Not included

- `WorksPage.vue` unification.
- Router overhaul.
- `/tools/wiper` route removal.
- Legacy Super/Notion runtime.
- Lightbox, Tooltip, VENOM NAV, or Pagecard legacy adapters.
- Markdown AST based Vue renderer.
- GitHub Pages deploy workflow.

## Completion criteria

- `MarkdownDocumentView.vue` exists.
- `pageLookup.ts` exists.
- `MarkdownPage.vue`, `HomePage.vue`, and `WiperPage.vue` are thin wrappers.
- TOC rendering still works through the shared view.
- Directive mounting still works through the shared view.
- Related footer rendering still works through the shared view.
- Home explicitly hides related footer.
- Works remains a collection page.
- Shared not-found state exists.


## Build verification

`npm run build` passed after adding `ignoreDeprecations: "6.0"` to `tsconfig.json` for the current TypeScript baseUrl deprecation warning. Vite emitted a warning from `gray-matter`/`js-yaml` about direct eval in a dependency, but the production build completed.
