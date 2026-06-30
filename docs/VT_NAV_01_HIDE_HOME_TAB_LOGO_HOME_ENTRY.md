# VT-NAV-01

Hide Home Tab /
Logo Home Entry /
No Home Category Surface

## SSOT

- Home route: `/`
- Home entry surface: brand logo
- Header category navigation excludes home
- Footer category navigation excludes home
- The home page remains directly reachable

## Rule

홈은 카테고리가 아니다.  
홈은 브랜드 루트다.

사용자는 로고를 눌러 홈으로 돌아간다.

## Change

- Set the `home` navigation item surface to `['hidden']`
- Keep the brand logo RouterLink pointing to `/`
- Keep all other navigation items unchanged

## Scope

This patch does not remove the `/` route.
This patch does not remove the `home` navigation item from the source index.
This patch only removes the home item from exposed navigation surfaces.

## Verify

```powershell
npm run smoke:vt-nav-01-hide-home-tab-logo-home-entry
npm run build
```

## Commit

```txt
fix(nav): hide home tab and keep logo as home entry
```
