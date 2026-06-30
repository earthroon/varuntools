# VT-UI-14E WorkCard Internal SPA Navigation

## Seal

WorkCard Internal SPA Navigation / Prevent Document Reload For Generated Content / Keep Router Memory Cache / No Work Tab Post Flicker

## Problem

WorkCard used a plain anchor click path. Header and card prefetch can warm the markdown cache, but a browser document navigation can reboot the app and erase that in-memory cache.

## Contract

Internal WorkCard hrefs must preserve the app session and navigate with Vue Router. External links, hash links, non-left clicks, and modified clicks remain browser-handled.

## State Ownership

- WorkCard owns click event routing.
- lazyMarkdownPageLoader owns pageCache and pendingLoads.
- markdownNavigationPrefetch owns href warmup policy.
- MarkdownPage owns cached page hydration.

## PASS

- WorkCard imports useRouter.
- WorkCard has navigateCardTarget(event: MouseEvent).
- Internal click calls event.preventDefault and router.push(safeHref.value).
- Browser-handled, non-left, and modified clicks are preserved.
- @click uses navigateCardTarget, not warmCardTarget.
