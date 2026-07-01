# VT-UI-23R3 Public Content Adjacent Detail Pager

## Seal

```txt
VT-UI-23R3
Public Content Adjacent Detail Pager /
Works Tab Collection SSOT /
Current Route Entry Match /
No PageRegistry Work Context Detour
```

## Problem

The works tab renders entries through `useRouteManifest` and `usePublicContentCollection`. Earlier footer patches used the pageRegistry work detail context, so the detail footer did not share the same collection SSOT as the works tab.

## Decision

The adjacent pager shown on markdown detail routes must use the same public content collection pipeline that feeds the works tab.

## Changes

- Export `getPublicContentEntries` from `usePublicContentCollection.ts`.
- Make `usePublicContentCollection` consume that exported pure collection helper.
- Add `getAdjacentPublicContentEntries` for current route matching by slug, contentDir, and href aliases.
- Allow `WorkPager` to receive a minimal pager entry type with `href` and `title`.
- Add a MarkdownDocumentView fallback pager that renders from the public content collection when pageRegistry does not provide adjacent links.

## SSOT

```txt
Collection SSOT:
- src/composables/usePublicContentCollection.ts:getPublicContentEntries

Adjacent match:
- src/utils/getAdjacentPublicContentEntries.ts

Detail mount:
- src/components/markdown/MarkdownDocumentView.vue
```

## Forbidden

```txt
- src/data/works.ts
- hardcoded work arrays inside components
- using pageRegistry WorkDetailContext as the only adjacent pager source
```

## Pass markers

```txt
PASS_VT_UI_23R3_PUBLIC_CONTENT_ADJACENT_DETAIL_PAGER
PASS_VT_UI_23R3_WORKS_TAB_COLLECTION_SSOT
PASS_VT_UI_23R3_CURRENT_ROUTE_ENTRY_MATCH
PASS_VT_UI_23R3_NO_PAGEREGISTRY_WORK_CONTEXT_DETOUR
```
