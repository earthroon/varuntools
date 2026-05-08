# Markdown Components

## Markdown Box

```md
::markdown-box
type: ssot
title: 기준
::
내용을 작성합니다.
::
```

## Captioned Image

```md
![Alt text](./images/example.webp "[필수] 이미지 설명")
```

Supported badge prefixes: `[필수]`, `[선택]`, `[기타]`. Tooltip appears only when the `?` help button is hovered or keyboard-focus-visible.

## Section Gap

```md
::section-gap
::
```

## Before / After

```md
::before-after
before: ./images/before.webp
after: ./images/after.webp
caption: 비교 이미지
initial: 50
::
```

## Pagecard Grid

```md
::pagecard-grid
items: /tools/wiper,/lab/markdown-gallery
columns: auto
::
```

## CSV generation

Markdown directives can be generated from CSV so authors do not need to memorize every directive syntax.

```bash
npm run csv:page -- src/content/pages/works/project-name/page.csv
```

See `docs/authoring/csv-authoring.md`.

## Commit 50 layout contract

- Text and `markdown-box` remain in the content rail.
- `captioned-image`, `gallery-strip`, `video-player`, and `before-after` use the media breakout rail.
- `home-section` uses the separate home rail for card density.
- Mobile resets breakout to `width: 100%` to prevent horizontal scroll.

