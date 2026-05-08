# EWA Rollout Gate

Commit 113 adds a runtime rollout gate for the lazy WebGPU EWA gallery processor.

## Purpose

The rollout gate decides whether the active lightbox image is allowed to enter the EWA runtime. It does not change the original image, `page.csv`, generated manifests, or authoring metadata.

```txt
SSOT:
page.csv media metadata
MarkdownLightbox active item
EWA preset contract

Runtime decision:
rollout mode
feature flag
debug override
runtime health
quality budget
```

## Modes

```txt
off
  Always use original fallback.

debug-only
  Allow EWA only when vt:ewa-debug=true.

metadata-only
  Allow EWA only for images with explicit media metadata.
  This is the default.

enabled
  Allow EWA for active lightbox images unless blocked by metadata, health, budget, or WebGPU support.
```

## Environment flag

```txt
VITE_EWA_ROLLOUT_MODE=metadata-only
```

Allowed values:

```txt
off
debug-only
metadata-only
enabled
```

Default:

```txt
metadata-only
```

## Debug override

Debug override is only accepted when EWA debug mode is enabled.

```js
localStorage.setItem('vt:ewa-debug', 'true')
localStorage.setItem('vt:ewa-rollout', 'enabled')
```

Allowed values:

```txt
off
debug-only
metadata-only
enabled
```

## Priority

```txt
1. media.ewaEnabled=false
   → block EWA

2. media.pixelSafe=true
   → original fallback

3. rollout mode=off
   → block EWA

4. runtime health=cooldown/disabled
   → block EWA

5. WebGPU unsupported
   → block EWA

6. rollout mode=debug-only
   → allow only with debug enabled

7. rollout mode=metadata-only
   → allow only when explicit EWA media metadata is present

8. rollout mode=enabled
   → allow active image EWA
```

Individual image metadata wins over broad rollout. Even when rollout is `enabled`, `media.ewaEnabled=false` and `media.pixelSafe=true` still block EWA.

## Diagnostics

The debug panel shows:

```txt
rollout mode
allowed
reason
source
metadata presence
```

Warnings include:

```txt
EWA_DIAG_ROLLOUT_OFF
EWA_DIAG_ROLLOUT_DEBUG_ONLY_BLOCKED
EWA_DIAG_ROLLOUT_METADATA_REQUIRED
EWA_DIAG_ROLLOUT_ALLOWED_BY_METADATA
EWA_DIAG_ROLLOUT_ALLOWED_BY_DEBUG_OVERRIDE
```

## Non-goals

```txt
No server feature flag.
No remote config.
No analytics sending.
No page.csv automatic modification.
No manifest automatic modification.
No WorkCard GPU processing.
No global image processing.
```

## SSOT note

rollout gate는 `page.csv`를 수정하지 않으며, manifest나 이미지 에셋도 수정하지 않습니다. 이 결정은 active lightbox image에 대한 런타임 허용 여부만 판단합니다.

## Commit 114 fixture QA

Use `/qa/ewa-gallery` and `docs/authoring/ewa-fixture-gallery.md` to verify photo, UI, line-art, pixel-safe, disabled, and budget downgrade scenarios. The fixture page is hidden/noindex and must not be treated as portfolio content.
