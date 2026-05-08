# Commit 110 migration

Commit 110 adds per-image EWA authoring metadata for portfolio gallery images.

## Added

- `media.ewaPreset`
- `media.ewaMode`
- `media.pixelSafe`
- `media.ewaEnabled`
- `media.ewaNote`
- `smoke:ewa-authoring-metadata`

## Flow

```txt
page.csv case-gallery-item options
→ markdown directive body metadata
→ parseGalleryStripItems
→ CaseGallery item metadata
→ vt:open-gallery payload
→ MarkdownLightbox active item
→ useEwaGalleryProcessor
→ resolveEwaPresetFromAuthoring
```

## Safety contract

- Metadata is a runtime hint.
- Metadata does not mutate the original image.
- EWA result is not SSOT.
- Processing remains active-lightbox-image only.
