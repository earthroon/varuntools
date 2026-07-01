# VT-UI-21

Route Navigation Scroll Top Policy /
New Markdown Page Top Reset /
Browser Back Saved Position /
No Mobile Deep Scroll Carryover

## Problem

Mobile route transitions can carry over the previous scroll position when an internal SPA link opens a new Markdown page. WorkCard uses router.push, so the browser does not perform a full document reload and does not automatically reset scroll to the top.

## SSOT

Route scroll policy is owned by:

- `src/router/index.ts`

It is not owned by:

- `WorkCard.vue`
- `MarkdownPage.vue`
- `MarkdownDocumentView.vue`
- `ContentCollectionGrid.vue`

## Contract

1. Browser back/forward saved position wins.
2. Hash navigation scrolls to the anchor with a fixed header offset.
3. Normal new route navigation scrolls to top-left.
4. Components do not patch this with ad-hoc `window.scrollTo` calls.

## Verify

```powershell
cd "D:\11124\dd\varuntools"

npm run smoke:vt-ui-21-route-scroll-top-policy
npm run build
```

## PASS tokens

```txt
PASS_VT_UI_21_ROUTE_NAVIGATION_SCROLL_TOP_POLICY
PASS_VT_UI_21_NEW_MARKDOWN_PAGE_TOP_RESET
PASS_VT_UI_21_BROWSER_BACK_SAVED_POSITION
PASS_VT_UI_21_NO_MOBILE_DEEP_SCROLL_CARRYOVER
```
