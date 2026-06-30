# VT-UI-21A

Work Index Desktop Stitch Explore Rail /
Inline Explore Section Removal /
Page-Side Sticky Rail /
Desktop Only /
No Mobile Drawer

## SSOT

- Filter state: `usePublicContentCollection(pages, { scope: 'index' })`
- UI surface: `WorkIndexDesktopStitchRail`
- Search controls: `ContentSearchPanel`
- Main content: `/works` hero + public content grid
- Sticky boundary: `/works` page shell, not global navigation

## Rule

탐색은 본문이 아니다.  
탐색은 조작 표면이다.

본문은 작업을 읽히고,  
스티치 레일은 페이지 사이드를 타고 작업을 조율한다.

## Scope

Desktop only.

Mobile drawer, mobile filter merge, control registry, and duplicated search surfaces are deferred to later patches.

## Changed Files

- `src/pages/WorksPage.vue`
- `src/components/content/ContentSearchPanel.vue`

## Added Files

- `src/components/content/WorkIndexDesktopStitchRail.vue`
- `scripts/smoke-vt-ui-21a-work-index-desktop-stitch-explore-rail.mjs`
- `docs/VT_UI_21A_WORK_INDEX_DESKTOP_STITCH_EXPLORE_RAIL.md`

## Verify

```powershell
npm run smoke:vt-ui-21a-work-index-desktop-stitch-explore-rail
npm run build
```
