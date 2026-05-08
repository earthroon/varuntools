# Commit 56 — Command Palette UI

Commit 56 connects the static `public/search-index.json` from Commit 55 to a global Vue command palette.

## Added

```txt
src/components/CommandPalette.vue
src/search/commandPalette.ts
src/styles/command-palette.css
scripts/smoke-command-palette.mjs
```

## Changed

```txt
src/App.vue
src/main.ts
package.json
scripts/check-launch.mjs
docs/authoring/search-index.md
docs/authoring/launch-checklist.md
```

## Contract

```txt
Ctrl/Command + K opens the palette.
Escape closes the palette.
ArrowUp/ArrowDown moves the active result.
Enter navigates to the active result.
Clicking a result navigates to that route.
```

The palette does not create a server-side search API. It fetches the committed static index from:

```txt
public/search-index.json
```

## Non-scope

```txt
fuzzy search library
full markdown body indexing
remote search API
user account history
analytics
```
