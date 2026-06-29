# CMS Markdown Text Block Public SSOT

Patch: `VT-CMS-11`

## Purpose

This contract seals how Markdown text blocks authored in VACMS are consumed by the public VarunTools repository.

The public repository must not invent a second text-block document model. It receives the published Markdown source and renders native Markdown headings and paragraphs.

## Canonical SSOT

Canonical SSOT: published markdown source file.

Examples:

```md
# Published H1 From CMS

This paragraph was authored as a CMS body text block.

## Published H2 From CMS

This second paragraph must remain native markdown, not a directive.
```

## Not SSOT

These are editor/runtime states in VACMS and must not become public-renderer SSOT:

- CMS editor block array
- `MarkdownTextBlockForm` draft
- `activeCanvasInsertAnchor`
- `insertedDraftPlaceholder`
- CMS focus receipt
- CMS transaction ledger

## Public Contract

1. H1 blocks publish as native ATX Markdown headings: `# Title`.
2. H2 blocks publish as native ATX Markdown headings: `## Subtitle`.
3. Body blocks publish as native Markdown paragraphs.
4. Draft placeholder sentinels must not appear in public content.
5. Public rendering must not require conversion into `::markdown-box`.
6. Public rendering must not require conversion into `::editorial-title`.
7. Public rendering must not add a custom text-block directive, component, or model.
8. Public rendering must not depend on D1, R2, an admin API, or CMS editor state.

## Placeholder Leak Sentinels

These strings are draft-only and must not be present in public content:

- `[새 제목을 입력하세요]`
- `[새 소제목을 입력하세요]`
- `[본문을 입력하세요]`

## Verification

```powershell
cd "D:\11124\dd\varuntools"

npm run smoke:cms-markdown-text-block-public-ssot
npm run build
```

## Completion

`PASS_VARUNTOOLS_CMS_MARKDOWN_TEXT_BLOCK_PUBLIC_SSOT`

No Public Text Block Model.
