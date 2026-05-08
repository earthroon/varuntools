# Media Authoring

```md
::video-player
src: ./videos/demo.webm
poster: ./images/cover.webp
title: Tool Demo
caption: 도구 사용 예시 영상입니다.
controls: true
preload: metadata
::
```

Put videos in page-local `videos/` and posters in page-local `images/`. Native controls are enabled by default. `autoplay` is only safe when `muted` is true.

## Commit 50 — Media Breakout Rail

본문 텍스트는 `--vt-content-max` 폭에 남기고, 미디어 컴포넌트는 자동으로 `vt-media-breakout` rail을 사용한다. 작성자는 별도 `wide: true` 옵션을 넣지 않는다.

자동 breakout 대상:

```txt
::captioned-image
::gallery-strip
::video-player
::before-after
```

`::markdown-box`는 설명/주의/SSOT 블록이므로 wide rail을 쓰지 않는다. 상품/작업 카드가 들어가는 `::home-section`은 미디어 rail이 아니라 `--vt-home-max` 기반 home rail을 사용한다.

