# CMS Markdown Text Placeholder Public Guard

## Patch

VT-CMS-12

## Purpose

Block CMS draft placeholder sentinels from leaking into public VarunTools content.

The public repository must consume published Markdown as its SSOT. H1, H2 and body text blocks authored in VACMS are not public text-block models. They are native Markdown once published.

## SSOT

| Layer | SSOT |
| --- | --- |
| Published content | `src/content/pages/**/*.md` |
| Placeholder list | `scripts/cmsMarkdownTextPlaceholderGuard.mjs` |
| Guard report | `artifacts/cms/markdown-text-placeholder-public-guard.vt-cms-12.json` |

## Blocked placeholders

```txt
[새 제목을 입력하세요]
[새 소제목을 입력하세요]
[본문을 입력하세요]
```

## Policy

- Scan only Markdown files under `src/content/pages`.
- Exclude `.git`, `node_modules`, `dist`, `artifacts` and `.tmp`.
- Use exact placeholder matching.
- Do not mutate source content.
- Do not auto-delete placeholders.
- Do not modify public Markdown renderers.
- Do not add D1, R2 or API coupling.

## Commands

```powershell
cd "D:\11124\dd\varuntools"

npm run smoke:cms-markdown-text-placeholder-public-guard
npm run smoke:cms-markdown-text-block-public-ssot
npm run build
```

## PASS token

```txt
PASS_VARUNTOOLS_CMS_MARKDOWN_TEXT_PLACEHOLDER_PUBLIC_GUARD
```
