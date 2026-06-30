# VT-NAV-02

Remove Duplicate Inquiry Utility Button /
Primary Inquiry Only /
No Empty Utility Navigation Shell

## SSOT

- Inquiry route: `/inquiry`
- Inquiry entry surface: primary header navigation
- Inquiry utility surface: excluded
- Utility nav shell: render only when at least one utility item exists

## Rule

문의는 하나면 충분하다.

상단 중앙의 `문의`는 primary navigation이다.  
오른쪽 pill형 `문의`는 중복 진입면이므로 제거한다.

## Scope

This patch does not remove the inquiry page or route.  
It only removes the duplicated `utility` surface from the inquiry navigation item.

## Changed Files

- `src/navigation/pageIndex.ts`
- `src/components/layout/SiteHeader.vue`

## Added Files

- `scripts/smoke-vt-nav-02-remove-duplicate-inquiry-utility.mjs`
- `docs/VT_NAV_02_REMOVE_DUPLICATE_INQUIRY_UTILITY.md`

## Verify

```powershell
npm run smoke:vt-nav-02-remove-duplicate-inquiry-utility
npm run build
```
