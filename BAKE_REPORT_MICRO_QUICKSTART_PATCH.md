# Micro Quickstart Patch Bake Report

## 변경 목적

Micro Markdown을 문법 체계가 아니라 VarunTools 페이지 작성을 위한 **작성 카드 / 페이지 주문서**로 인식할 수 있도록 작성자 노출면을 줄였습니다.

## 반영 파일

- `MICRO_QUICKSTART.md`
- `package.json`
- `scripts/lib/micro-markdown/scaffold.mjs`

## 반영 내용

1. 루트에 `MICRO_QUICKSTART.md`를 추가했습니다.
   - 직접 수정할 SSOT를 `.micro.md`로 고정했습니다.
   - 기본 템플릿과 자주 쓰는 추가 카드만 남겼습니다.
   - 일반 Markdown과 Micro Markdown의 선택 기준을 분리했습니다.

2. `package.json`에 `publish:content` 명령을 추가했습니다.
   - 평소 작성자는 `npm run publish:content`만 실행하면 됩니다.
   - 내부적으로 기존 `build` 루틴을 호출합니다.
   - 기존 `prebuild`가 `content:compile`과 `content:check`를 이미 수행하므로 중복 파이프라인을 만들지 않았습니다.

3. 새 Micro 페이지 스캐폴드에 안내 주석을 추가했습니다.
   - `work.micro.md`: `work.easy.md / index.md`는 생성물임을 명시합니다.
   - `page.micro.md`: `page.easy.md / index.md`는 생성물임을 명시합니다.
   - 작성 후 명령을 `npm run publish:content`로 단순화했습니다.

## SSOT

```txt
작성 원본: work.micro.md / page.micro.md
생성물: work.easy.md / page.easy.md / index.md / dist
작성자 기본 명령: npm run publish:content
```
