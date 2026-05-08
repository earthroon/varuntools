# EWA Device Tier and Quality Budget

Commit 111 adds a runtime quality budget for the lazy WebGPU EWA lightbox path.

## SSOT

The source of truth remains:

- `page.csv`
- image authoring metadata such as `media.ewaPreset` and `media.ewaMode`
- the active `MarkdownLightbox` item

Device tier and quality budget are **runtime decisions**, not content SSOT. They never rewrite `page.csv`, asset metadata, or generated manifests.

## Why this exists

The same EWA request should not run identically on every device. A high-end desktop can afford a larger target and adaptive tiles. A low-tier or unstable WebGPU environment should clamp target size, disable adaptive tiles, shorten timeout, or fall back safely.

## Tiers

- `unsupported`: WebGPU unavailable or adapter/device request failed. EWA is bypassed.
- `low`: conservative budget, smaller target, adaptive disabled.
- `medium`: default budget, adaptive allowed.
- `high`: larger target, adaptive allowed, larger cache.

## Budgets

| Tier | Target cap | Timeout | Adaptive | Cache | DPR cap |
|---|---:|---:|---|---:|---:|
| unsupported | 0 | 0ms | no | 0 | 1 |
| low | 960×960 | 1800ms | no | 1 | 1.25 |
| medium | 1440×1440 | 3000ms | yes | 3 | 1.5 |
| high | 1920×1920 | 3500ms | yes | 5 | 2 |

## Downgrade policy

Authoring metadata is preserved, but the runtime may safely downgrade execution.

```txt
media.ewaMode=adaptive-tile
low tier
→ resolved mode: basic
→ diagnostic: EWA_DIAG_ADAPTIVE_DISABLED_BY_BUDGET
```

Unsupported devices go to original fallback.

```txt
unsupported tier
→ resolved mode: original
→ fallback reason: quality-budget-original or WebGPU failure reason
```

## Debug override

Use only when EWA debug mode is enabled.

```js
localStorage.setItem('vt:ewa-debug', 'true')
localStorage.setItem('vt:ewa-tier', 'low')
```

Supported values:

```txt
low
medium
high
auto
```

## Diagnostics

The debug panel shows:

- tier
- tier reason
- requested mode
- resolved mode
- target clamp
- timeout budget
- DPR cap
- adaptive/basic allowance

Budget warnings are runtime diagnostics only. They are not publish-gate errors.

## Rollout gate relationship

Quality budget is only evaluated after the rollout gate allows EWA for the active lightbox image. If rollout mode is `off`, `debug-only` without debug, or `metadata-only` without EWA metadata, the processor uses original fallback before target clamp or compute mode downgrade.
