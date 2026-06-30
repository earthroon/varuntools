# VT-UI-14 Desktop Portfolio Tab Flicker Guard

## Title

```txt
VT-UI-14

Desktop Portfolio Tab Flicker Guard /
No Product Placeholder During Tab Transition /
Keep Last Resolved Pane /
No Cognitive Flicker
```

## Problem

On desktop, clicking the main portfolio navigation entries can briefly expose the product placeholder page during route transition.

Affected navigation surface:

```txt
작업 / 상품 / 전후 비교
```

The flicker is not a content failure. It is a transition-state leak. A placeholder that belongs to the product page must not become a temporary global fallback while another route is being selected or resolved.

## SSOT

```txt
Primary SSOT:
- resolved route path

Display SSOT:
- keyed RouterView route instance

Critical route component SSOT:
- eager route components for above-the-fold portfolio navigation

Placeholder SSOT:
- product placeholder may only belong to the resolved product route/content
```

## State ownership

```txt
Router:
- owns route resolution
- critical public navigation components are resolved eagerly

App shell:
- owns RouterView instance boundary
- route.fullPath keys the displayed route component

MarkdownPage:
- owns markdown slug loading state after the route is resolved
- does not own global navigation fallback
```

## Invariants

```txt
Invariant 1:
A non-product route must not display the product placeholder during transition.

Invariant 2:
The product placeholder must never be used as an unknown/pending route fallback.

Invariant 3:
The app shell must key the rendered route view by route.fullPath.

Invariant 4:
Critical portfolio navigation route components must not depend on async component resolution during desktop tab switching.

Invariant 5:
Public markdown renderer, directive registry, CMS sourceBody, and product catalog data are not modified by this patch.
```

## Implementation

The apply script patches `src/router/index.ts` to import these critical route components eagerly:

```txt
HomePage
WorksPage
MarkdownPage
```

It patches `src/App.vue` so `RouterView` renders through a keyed route component boundary:

```txt
RouterView v-slot
:key="route.fullPath"
data-vt-ui14-route-view
```

This removes the visible stale-pane leak while preserving existing route ownership.

## Non-goals

```txt
- do not implement product page content
- do not change product catalog filtering
- do not touch CMS markdown text block SSOT
- do not touch directive types or directive renderer
- do not add animation
- do not rewrite navigation taxonomy
```

## Smoke

`npm run smoke:vt-ui-14-tab-flicker-guard` checks:

```txt
- router has eager critical route component imports
- router does not lazy-load HomePage / WorksPage / MarkdownPage for critical paths
- App.vue uses a keyed RouterView route boundary
- package.json exposes the VT-UI-14 smoke command
- header navigation SSOT still contains works/products/wiper labels
```

## Manual QA

```txt
작업 -> 상품 -> 전후 비교 -> 작업 -> 전후 비교
```

PASS:

```txt
- no product placeholder appears while moving to 작업
- no product placeholder appears while moving to 전후 비교
- product placeholder appears only when 상품 route is actually selected/resolved
- desktop tab switching does not create cognitive flicker
```

FAIL:

```txt
- 상품 준비중 appears for one visible transition frame on a non-product route
- route component falls back to product while resolving another route
- tab switching feels like a wrong-page flash
```

## Operator rule

```txt
탭 전환 중 상품 준비중이 알짱거리면 치워.
```
