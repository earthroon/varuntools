# VT-UI-23R1 Visible Work Adjacent Footer

## Seal

Visible Work Adjacent Footer Mount / Work Detail Pager Hard Render / Current Slug Alias Context Repair / No Invisible Previous Next UI

## Contract

- Do not create src/data/works.ts.
- Keep pageRegistry.ts as the work metadata SSOT.
- Repair getWorkDetailContext with slug alias lookup.
- Sort adjacent work entries by order.
- Render WorkPager through WorkDetailFooter.
- Add visible DOM markers for footer, pager mount, nav, and links.

## Verify

```powershell
npm run smoke:vt-ui-23r1-visible-work-adjacent-footer
npm run build
```
