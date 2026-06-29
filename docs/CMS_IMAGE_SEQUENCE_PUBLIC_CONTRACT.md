# CMS Image Sequence Public Contract

Patch: VT-CMS-01

This document defines the public markdown contract for the CMS image sequence directive.

## Scope

The public repo accepts the published `::image-sequence` directive and serializes it into an `<image-sequence>` custom element with a `<template data-image-sequence-items>` JSON payload.

This patch does not add runtime mounting and does not optimize images.

## Input

```txt
::image-sequence
layout: crop-strip
reserved: true
lazy: true
fade: true
::
assetId: asset_001
src: /assets/content/pages/demo/crop-001.webp
width: 1200
height: 800
filename: crop-001.webp
mimeType: image/webp
alt: first image
caption: optional caption
---
assetId: asset_002
src: /assets/content/pages/demo/crop-002.webp
alt: second image
::
```

## Output

```html
<image-sequence data-layout="crop-strip" data-reserved="true" data-lazy="true" data-fade="true"><template data-image-sequence-items>[...]</template></image-sequence>
```

## Non-goals

- No ImageSequence.vue.
- No mountMarkdownComponents.ts change.
- No image optimization.
- No D1 lookup.
- No R2 list.
