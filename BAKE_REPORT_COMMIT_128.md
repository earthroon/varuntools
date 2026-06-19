# BAKE REPORT — COMMIT 128

## Patch
CMS_D1_017A_R2Z_R1W_R4_LIVE_R2_F6_F55

## Scope
Navigation page index launch report reseal.

## Commit 128
This report seals the navigation page index contract for the public generated site release path.

## Required smoke
- smoke:navigation-page-index

## Required files
- src/navigation/navigationTypes.ts
- src/navigation/pageIndex.ts
- src/navigation/sectionNavigation.ts
- src/navigation/navigationVisibility.ts
- scripts/smoke-navigation-page-index.mjs
- generated/page-inventory.json
- docs/authoring/navigation-page-index.md
- docs/migration/commit-128.md
- BAKE_REPORT_COMMIT_128.md

## Contract
The navigation page index must expose public, active, indexable pages only.
Hidden, noindex, checkout, QA, dummy, playground, and spec pages must not leak into public navigation.

## Seal
No parser rewrite.
No inquiry system changes.
No generated public navigation adoption beyond the existing smoke contract.
No object serialization leak.
