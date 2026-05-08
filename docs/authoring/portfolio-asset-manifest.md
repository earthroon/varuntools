# Portfolio Asset Manifest

Commit 103 adds a generated manifest for portfolio media usage. The manifest does not replace `page.csv`; it is derived from CSV/frontmatter content so media loading policy can be checked before launch.

## SSOT

```txt
source of truth: page.csv / frontmatter.work
generated artifact: src/content/generated/portfolio-asset-manifest.json
```

Do not hand-edit the manifest. Rebuild it with:

```bash
npm run build:portfolio-assets
```

## What the manifest records

Each asset entry stores:

- source CSV path
- page slug
- CSV block and field
- source value
- normalized project path
- existence state
- kind: `image`, `video`, or `unknown`
- role: `cover`, `thumb`, `gallery`, `poster`, `video`, `before-after`, or `inline`
- priority: `high`, `normal`, or `low`
- loading: `eager` or `lazy`
- file size and warning codes

## Loading policy

| Usage | Role | Policy |
| --- | --- | --- |
| `portfolio-hero.src` | cover | `loading="eager"`, `decoding="async"`, `fetchpriority="high"` |
| WorkCard/Home featured cover | cover/thumb | `loading="lazy"`, `decoding="async"` |
| Case gallery images | gallery | `loading="lazy"`, `decoding="async"` |
| Video poster | poster | lazy image policy |
| Video source | video | manifest classification only |

## Warning thresholds

Warnings do not block generation by default. They make heavy media visible before launch.

| Code | Threshold |
| --- | --- |
| `PORTFOLIO_ASSET_LARGE_IMAGE` | image over 800KB |
| `PORTFOLIO_ASSET_LARGE_VIDEO` | video over 5MB |
| `PORTFOLIO_ASSET_LARGE_SVG` | SVG over 300KB |
| `PORTFOLIO_ASSET_UNKNOWN_EXTENSION` | extension outside known image/video sets |
| `PORTFOLIO_ASSET_EXTERNAL_UNMANAGED` | external URL reference |

## Launch checklist

```bash
npm run csv:pages
npm run build:portfolio-assets
npm run smoke:portfolio-asset-manifest
```

Confirm that missing and large counts are intentional before publishing.

## SEO connection

Commit 104 uses the generated portfolio asset manifest as an image fallback source for SEO entries. The SEO builder reads page frontmatter first, then uses manifest cover-role assets when page-specific image metadata is unavailable.

```bash
npm run build:portfolio-assets
npm run build:portfolio-seo
```

The asset manifest remains a derived artifact. Do not edit it by hand to change SEO image behavior; update the source page metadata or CSV asset references instead.

## Publish gate relation

`npm run check:publish` reads `portfolio-asset-manifest.json` to catch missing assets and large cover warnings for public work pages.

## Relationship to lazy WebGPU EWA

The asset manifest describes original media references and loading policy. Commit 108 adds a separate runtime EWA refinement path for opened lightbox images.

The manifest remains source metadata. The WebGPU output is not written back into the manifest and is not treated as SSOT.
