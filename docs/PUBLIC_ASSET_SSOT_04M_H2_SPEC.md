# PUBLIC-ASSET-SSOT-04M-H2

Home Vertical Rhythm Reclaim / Compact Markdown Shell / Overbroad Late Reserve Removal Seal

## Goal

After pruning empty product/work home sections, the global markdown shell still reserves a full viewport through `.vt-markdown-page { min-height: 100vh; }`. This creates a huge blank gap before the home recent section. H2 reclaims that rhythm with a Vue-owned compact shell mode.

## Source of Truth

- `MarkdownDocumentView.vue` owns page shell mode with `pageShell: 'default' | 'compact'`.
- `HomePage.vue` opts into `page-shell="compact"`.
- `markdown.css` only defines the compact class semantics.

## Non-goals

- Do not hide home sections by CSS.
- Do not remove recent content.
- Do not globally remove `min-height: 100vh` from all markdown pages.
- Do not reintroduce broad late container reserve for ready content.

## PASS

`PASS_PUBLIC_ASSET_SSOT_04M_H2_HOME_RHYTHM_RECLAIM`
