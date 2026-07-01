# VT-UI-23

## Work Adjacent Navigation Context / Page Registry Work Meta Projection / Order Based Previous Next / No Duplicate Works Data SSOT

### Goal

Add order-based previous/next work navigation without creating a duplicate `src/data/works.ts` metadata source.

### SSOT

- Work metadata SSOT: `src/markdown/pageRegistry.ts`
- Adjacent calculation owner: `src/utils/getAdjacentWorks.ts`
- Display owner: `src/components/works/WorkPager.vue`

### Non-goals

- Do not create `src/data/works.ts`.
- Do not hard-code work metadata inside a component.
- Do not calculate adjacent links from route order.
- Do not add CMS/D1/R2 persistence.

### PASS markers

```txt
PASS_VT_UI_23_WORK_ADJACENT_NAVIGATION_CONTEXT
PASS_VT_UI_23_PAGE_REGISTRY_WORK_META_PROJECTION
PASS_VT_UI_23_ORDER_BASED_PREVIOUS_NEXT
PASS_VT_UI_23_NO_DUPLICATE_WORKS_DATA_SSOT
```
