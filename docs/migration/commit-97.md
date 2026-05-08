# Commit 97 - Home Featured Works

`feat(home): render featured works from frontmatter.work`

This commit adds a homepage featured works section backed by the normalized Works collection.

## What changed

- Added `HomeFeaturedWorks.vue`.
- Mounted it in `HomePage.vue` below the markdown-rendered home document.
- Selected entries from `getWorkCollectionEntries()`.
- Required both `entry.featured` and `entry.hasWorkMetadata` so product/store pages using legacy root `featured` metadata do not leak into portfolio featured slots.
- Hid `private` and `draft` work statuses.
- Reused existing WorkCard and `var(--vt-*)` tokens.
- Added `smoke:home-featured-works` and launch-gate wiring.

## Excluded

- Homepage redesign.
- Search or tag index.
- SEO structured data.
- Animation or lightbox behavior.
