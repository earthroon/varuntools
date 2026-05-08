# Commit 129 Migration

## Commit

`feat(navigation): connect page index to site header and footer`

## From Commit 128

Commit 128 added the structured page index and section navigation contract. Commit 129 connects that data to actual Header, Footer, and Utility navigation UI.

## Added

- `SiteHeader.vue`
- `SiteFooter.vue`
- `SiteNavigationLink.vue`
- `navigationActive.ts`
- `site-navigation.css`
- `smoke:navigation-ui-connection`

## Preserved

- No route rewrite.
- No page slug migration.
- No sitemap/search rewrite.
- No inquiry/admin/Worker/D1 changes.
- No editorial component changes.

## Guardrail

Header and Footer now read from `sectionNavigation`. Hidden, noindex, QA, checkout, dummy, playground, and private showcase pages remain out of public navigation.
