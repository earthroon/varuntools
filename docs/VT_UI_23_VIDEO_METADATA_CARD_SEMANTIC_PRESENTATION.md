# VT-UI-23 Video Metadata Card Semantic Presentation

Status: Implementation Bake
Base inspected commit: `2ac6d3d9db73d8b9b0bfe138e5934fb6fdc2cdf3`

## Seal

Video title and caption are semantic metadata, not Markdown body text.

```txt
CMS title   -> VideoPlayer.title
CMS caption -> VideoPlayer.caption

title || caption -> attached figcaption metadata card
Markdown parsing -> forbidden
metadata width -> VideoPlayer figure width
```

## DOM

```html
<figure class="vt-video-player">
  <div class="vt-video-player__stage">...</div>
  <figcaption class="vt-video-player__caption">
    <strong class="vt-video-player__title">...</strong>
    <span class="vt-video-player__text">...</span>
  </figcaption>
</figure>
```

The card is omitted when both values are empty. Title-only and caption-only are valid.

## Presentation authority

`src/styles/markdown-components.css` is the single video metadata presentation authority.
`VideoPlayer.vue` scoped CSS remains responsible for playback mechanics, controls, fullscreen and frame geometry only.

## Geometry

`.vt-video-player` remains frame-width authority. The metadata card uses `width: 100%` and normal flow. No independent portrait/landscape width math is introduced.

## Literal text

Vue interpolation must render `title` and `caption` literally. No Markdown renderer and no `v-html` may be used for metadata.

## Non-changes

- segmented playback unchanged
- stream manifest unchanged
- fullscreen authority unchanged
- control hit ownership unchanged
- poster projection unchanged
- R2 delivery unchanged
- directive schema unchanged
