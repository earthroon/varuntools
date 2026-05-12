# 08 Vue Generated Renderer

## SSOT

- Google Sheet is the authoring SSOT.
- Google Drive is the source asset SSOT.
- `src/content/generated/pages.generated.json` is the public-safe render input.
- Vue components render generated JSON and do not own authoring state.

## Actual VarunTools integration

The current VarunTools site already owns page assets under each content page folder:

```txt
src/content/pages/works/{pageId}/index.md
src/content/pages/works/{pageId}/images/*
src/content/pages/works/{pageId}/media/*
```

Sheet CMS generated assets follow the same page-owned rule. For generated work pages, image assets are written to:

```txt
src/content/pages/works/{pageId}/images/{assetId}.webp
```

Generated JSON keeps relative sources such as:

```txt
./images/cover_main.webp
```

The renderer resolves those paths through the existing VarunTools content asset registry, using the page `contentDir` context.

## Files

```txt
src/types/generatedContent.ts
src/lib/generated-content/loadGeneratedPages.ts
src/lib/generated-content/findGeneratedPage.ts
src/lib/generated-content/generatedRoutes.ts
src/lib/generated-content/resolveGeneratedAssetSrc.ts
src/lib/generated-content/generatedWorkEntries.ts
src/pages/GeneratedPageView.vue
src/components/generated/GeneratedPageRenderer.vue
src/components/generated/GeneratedBlockRenderer.vue
src/components/generated/GeneratedPageHero.vue
src/components/generated/blockRendererRegistry.ts
src/components/generated/blocks/TextBlock.vue
src/components/generated/blocks/CalloutBlock.vue
src/components/generated/blocks/CompareBlock.vue
src/components/generated/blocks/ImageBlock.vue
src/components/generated/blocks/CtaBlock.vue
src/components/generated/blocks/FaqBlock.vue
src/styles/generated-content.css
```

## Routing

`src/router/index.ts` imports `generatedRoutes` and places them before the catch-all Markdown route.

```ts
...generatedRoutes,
{
  path: '/:slug+',
  name: 'markdown-page',
  component: () => import('@/pages/MarkdownPage.vue'),
}
```

Generated routes use each page slug:

```txt
works/arosaegim-tool -> /works/arosaegim-tool
```

Manual route collisions are not resolved in the renderer. They must be blocked by validation.

## Works collection

`useWorksCollection()` now merges Markdown work entries with generated work entries. This keeps sheet-authored work pages visible in the existing Works index without replacing the existing Markdown page registry.

## Block renderer

Supported initial block kinds:

```txt
text
callout
compare
image
cta
faq
```

`blockRendererRegistry.ts` is the renderer compatibility SSOT. Validation should fail if generated JSON contains a block kind that is missing from this registry.

## Security rules

- Do not use `v-html` for generated block body.
- `TextBlock`, `CalloutBlock`, and `FaqBlock` render plain text.
- CTA URL safety is checked in `validate:generated-content` before rendering.
- Page-owned assets are resolved through `resolveContentAssetMeta`, not by exposing Drive URLs.

## Smoke command

```bash
npm run smoke:generated-renderer
```

Checks:

- required renderer files exist
- router imports generated routes
- generated CSS is imported
- block registry supports required kinds
- page context is passed into block renderer
- CompareBlock uses a keyboard-accessible range input
- generated body blocks do not use `v-html`
