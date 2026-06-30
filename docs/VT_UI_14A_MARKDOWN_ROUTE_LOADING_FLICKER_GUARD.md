# VT-UI-14A Markdown Route Loading Flicker Guard

## Title

VT-UI-14A

Markdown Route Loading Flicker Guard /
Retain Last Resolved Markdown Page /
No Loading NotFound Fallback During Route Transition /
No Cognitive Flicker

## Problem

Desktop portfolio navigation still shows a cognitive flicker after VT-UI-14.

Observed text:

- `문서를 불러오는 중입니다`
- `현재 경로의 문서를 준비하고 있습니다.`

This is not the product placeholder leak anymore. It is the Markdown route loading fallback leaking during route transition.

## Cause

`MarkdownPage.vue` clears `page` when a new slug starts loading. Since `MarkdownDocumentView` renders the not-found/loading block when `page` is null, the loading fallback becomes visible for a short transition frame.

If `App.vue` also keys `RouterView` by `route.fullPath`, the route component remounts on every navigation and makes it impossible to retain the last resolved page.

## SSOT

```txt
문서 전환 중 page를 비우지 않는다.
```

## State Ownership

- `slug`: route-derived input.
- `page`: last resolved Markdown page display SSOT.
- `loadState`: request state, not display-clearing authority.
- `requestId`: async race guard.
- `MarkdownDocumentView`: consumes the visible page. It must not receive `null` during ordinary route loading if a last page exists.

## Invariants

1. Loading a new slug must not clear `page`.
2. The previous resolved page remains visible while the next Markdown page loads.
3. `page` becomes `null` only after a confirmed `not_found` or `error` result.
4. `RouterView` is not keyed by route path/fullPath for this flow.
5. The loading fallback is allowed only on cold start when no previous page exists.

## Non-goals

- No product page implementation.
- No portfolio navigation redesign.
- No Markdown directive or renderer contract change.
- No D1/R2/CMS boundary change.
- No animation added to hide the issue.

## PASS

```txt
PASS_VT_UI_14A_MARKDOWN_ROUTE_LOADING_FLICKER_GUARD
PASS_VT_UI_14A_RETAIN_LAST_RESOLVED_MARKDOWN_PAGE
PASS_VT_UI_14A_NO_ROUTER_VIEW_KEYED_REMOUNT
```

## Manual QA

1. Open the public site on desktop.
2. Click `작업`, `상품`, `전후 비교` repeatedly.
3. Confirm no intermediate `문서를 불러오는 중입니다` or `현재 경로의 문서를 준비하고 있습니다.` panel appears during ordinary transitions.
4. Confirm actual missing pages can still show a not-found message.
