# VT-UI-21A-R2

Work Index Page Side Scroll Anchor /
Vue-owned Rail Position Sync /
No Grid Rail Column /
Desktop Only /
No Mobile Drawer

## SSOT

- Filter state: `usePublicContentCollection(pages, { scope: 'index' })`
- Page side anchor: `.vt-work-index-main`
- Scroll-follow behavior: `WorkIndexDesktopStitchRail.vue`
- Desktop rail placement: `anchorRect.left - RAIL_WIDTH_PX - RAIL_GAP_PX`
- Main content flow: normal centered `.vt-markdown` flow

## Rule

탐색 레일은 본문을 밀지 않는다.
탐색 레일은 페이지 컨테이너의 왼쪽 사이드를 기준으로 붙는다.
탐색 레일은 Vue가 스크롤과 리사이즈를 감지해 화면 안에서 따라오게 한다.

## Scope

Desktop only.
Mobile SSOT and mobile drawer behavior are explicitly deferred.

## Verify

```powershell
npm run smoke:vt-ui-21a-r2-work-index-page-side-scroll-anchor
npm run build
```
