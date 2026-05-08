# Commit 21 Migration Notes

## Old Super/Notion pattern

The legacy VENOM NAV rendered utility controls inside `.wiki-nav` and used direct browser calls for back, parent, and home navigation.

## New Vue-native SSOT

`MarkdownToc.vue` owns the utility controls and uses Vue Router for navigation.

- Back: `router.back()` when browser history exists, otherwise `fallbackBackHref`.
- Up: current route parent path via `getParentPath(route.path)`.
- Home: `homeHref`, default `/`.

## Non-goals

- Do not restore `.wiki-nav` runtime scanning.
- Do not restore Super/Notion nav drift CSS hacks.
- Do not bind parent navigation to content registry in this commit.
