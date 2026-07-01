# VT-UI-23R2 Markdown Route Work Footer Enable

## Contract

- `MarkdownPage.vue` must not pass `:pages="[]"` into `MarkdownDocumentView`.
- `MarkdownPage.vue` must not force `:show-related-footer="false"`.
- The lazy markdown loader owns the page list source for markdown routes.
- `MarkdownDocumentView` receives a real `pages` prop so `getWorkDetailContext` can build previous/next work context.
- R1 visible footer and pager markers remain required.
- `src/data/works.ts` remains forbidden.

## PASS markers

- PASS_VT_UI_23R2_MARKDOWN_ROUTE_WORK_FOOTER_ENABLE
- PASS_VT_UI_23R2_LAZY_PAGE_REGISTRY_PAGES_PROP
- PASS_VT_UI_23R2_RELATED_FOOTER_MOUNT_GATE_REOPEN
- PASS_VT_UI_23R2_NO_DEAD_WORKPAGER_WIRING
