# EWA Fixture Gallery

## SSOT

- Fixture source: `src/content/pages/qa/ewa-gallery/page.csv`
- Generated page: `src/content/pages/qa/ewa-gallery/index.md`
- Synthetic assets: `public/qa/ewa-fixtures/*`

The fixture gallery is a QA surface only. It is not a portfolio work, not a product, and not a searchable public content target.

## Route

```txt
/qa/ewa-gallery
```

The page must remain:

```txt
visibility=hidden
robots=noindex,follow
noindex=true
```

It should stay excluded from:

- sitemap / SEO index
- page search index
- portfolio tag index
- works collection
- publish gate decisions

## Fixture scenarios

| Scenario | Metadata | Expected behavior |
| --- | --- | --- |
| Photo | `media.ewaPreset=photo; media.ewaMode=basic` | Basic EWA baseline without over-smoothing |
| UI screenshot | `media.ewaPreset=ui-low-ring; media.ewaMode=adaptive-tile` | Thin text and borders can be inspected for ringing/ghosting |
| Line art | `media.ewaPreset=line-art; media.ewaMode=adaptive-tile` | Thin line halo and smoothing are visible in split compare |
| Pixel safe | `media.ewaPreset=pixel-safe; media.pixelSafe=true` | EWA bypasses and original fallback stays active |
| Disabled | `media.ewaEnabled=false` | EWA stays disabled even if rollout is enabled |
| Budget downgrade | `media.ewaPreset=ui-low-ring; media.ewaMode=adaptive-tile` | With `vt:ewa-tier=low`, adaptive can downgrade to basic |

## QA commands

Enable diagnostics:

```js
localStorage.setItem('vt:ewa-debug', 'true')
localStorage.setItem('vt:ewa-compare', 'split')
```

Force rollout and adaptive mode:

```js
localStorage.setItem('vt:ewa-rollout', 'enabled')
localStorage.setItem('vt:ewa-mode', 'adaptive-tile')
```

Test quality budget downgrade:

```js
localStorage.setItem('vt:ewa-tier', 'low')
```

Test runtime cooldown:

```js
sessionStorage.setItem('vt:ewa-health', 'cooldown')
```

Reset after QA:

```js
localStorage.removeItem('vt:ewa-debug')
localStorage.removeItem('vt:ewa-compare')
localStorage.removeItem('vt:ewa-rollout')
localStorage.removeItem('vt:ewa-mode')
localStorage.removeItem('vt:ewa-tier')
sessionStorage.removeItem('vt:ewa-health')
```

## Contract

- The fixture gallery does not create new WebGPU behavior.
- The fixture gallery must not initialize EWA on page load.
- EWA is still active-lightbox-image only.
- Fixture images are synthetic and safe to ship as QA assets.
- Runtime diagnostics are not SSOT.
