# Commit 17 — Markdown Image / Lightbox Foundation

## 목적

Markdown 기본 이미지를 Vue-native Lightbox에 연결한다.

기존 Super/Notion DOM 후처리 Lightbox를 되살리는 것이 아니라, Markdown 렌더러가 기본 이미지에 `data-vt-lightbox="1"`을 부여하고 `MarkdownDocumentView.vue`가 해당 이미지를 수집해 `MarkdownLightbox.vue`로 확대 표시한다.

## 범위

- `imageRenderRule.ts` 추가
- Markdown 기본 이미지에 lazy/decoding/lightbox dataset 주입
- contentDir 기준 이미지 asset resolve
- `useLightbox.ts` 추가
- `MarkdownLightbox.vue` 추가
- `MarkdownDocumentView.vue`에 Lightbox lifecycle 연결
- `markdown-lightbox.css` 추가
- ESC / ArrowLeft / ArrowRight / backdrop / close 버튼 지원

## Lightbox 대상

- Markdown 기본 이미지
- `img[data-vt-lightbox="1"]`

## 제외 대상

- `WorkCard.vue` 내부 이미지
- `ImageCard.vue` 내부 이미지
- `BeforeAfterWiper.vue` before/after 이미지
- `VarunVideo.vue` poster
- UI 아이콘

## Caption 규칙

1. Markdown 이미지 title
2. alt text
3. 빈 문자열

예시:

```md
![작업물 미리보기](./images/work.svg "쇼룸 대표 이미지")
```

위 경우 alt는 `작업물 미리보기`, caption은 `쇼룸 대표 이미지`가 된다.

## 접근성 기준

- `role="dialog"`
- `aria-modal="true"`
- 닫기 / 이전 / 다음 버튼 `aria-label`
- ESC 닫기
- ArrowLeft / ArrowRight 이동
- body scroll lock
- 이미지 alt 유지

## 하지 않는 것

- 기존 Super/Notion Lightbox DOM 코드 이식
- Tooltip Caption 이식
- pinch zoom
- pan/drag zoom
- video lightbox
- image-card 전체 lightbox 연결
- image 다음 italic 문단 caption 승격
- legacy Notion image parser

## 완료 기준

- Markdown 기본 이미지에 `data-vt-lightbox="1"`이 붙는다.
- 이미지 클릭 시 Lightbox가 열린다.
- ESC / backdrop / close 버튼으로 닫힌다.
- 이미지가 여러 개일 때 좌우 이동된다.
- route/page 변경 시 listener가 중복되지 않는다.
- `npm run build:pages`가 통과한다.
