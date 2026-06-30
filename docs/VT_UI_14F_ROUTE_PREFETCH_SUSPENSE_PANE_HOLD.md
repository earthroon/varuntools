# VT-UI-14F-R2 Route Prefetch And Suspense Pane Hold

## Seal

Route Chunk Prefetch And Suspense Pane Hold /  
Viewport Internal Link Warmup /  
Hover Pointer Route Preload /  
No Empty View Transition Flicker

## SSOT

- Internal href is the navigation SSOT.
- routePrefetch.ts owns route chunk warmup and pending dedupe.
- markdownNavigationPrefetch.ts owns markdown source warmup.
- useViewportInternalLinkPrefetch owns viewport internal link warmup.
- App.vue owns Suspense pane hold during route transition.

## Operator rule

Links visible in the viewport should be warmed.  
Links under the pointer should be warmed harder.  
Do not remove the old pane until the next view is ready.

## Verification

```powershell
npm run smoke:vt-ui-14f-route-prefetch-suspense-pane-hold
npm run smoke:vt-ui-14e-workcard-spa-navigation
npm run smoke:vt-ui-14d-sync-cache-hydration
npm run smoke:vt-ui-14c-public-content-card-prefetch
npm run smoke:vt-ui-14b-markdown-prefetch-cache
npm run smoke:vt-ui-14a-markdown-route-loading-flicker-guard
npm run build
```
