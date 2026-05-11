# Micro Quickstart

직접 수정하는 파일은 `work.micro.md` 또는 `page.micro.md`뿐입니다.

Micro Markdown은 Markdown을 대체하는 새 언어가 아니라, VarunTools 페이지를 빠르게 만들기 위한 **작성 카드 / 페이지 주문서**입니다. 글처럼 자유롭게 쓰고 싶으면 일반 Markdown을 쓰고, 포트폴리오 작업 페이지처럼 반복 구조가 필요하면 Micro를 씁니다.

## 1. SSOT 규칙

| 파일 | 역할 | 직접 수정 |
|---|---|---|
| `work.micro.md` | Works 페이지 원본 | 예 |
| `page.micro.md` | 일반 페이지 원본 | 예 |
| `work.easy.md` / `page.easy.md` | 중간 번역본 | 아니오 |
| `index.md` | Vue가 읽는 최종 Markdown | 아니오 |
| `dist` | 배포 결과물 | 아니오 |

한 줄로 줄이면 이겁니다.

```txt
나는 .micro.md만 쓴다. 나머지는 빌드가 만든다.
```

## 2. 기본 템플릿

```md
@H1_제목
@DESC_한 줄 설명
@PUBLIC

@SUM_
요약.

@PROB_
문제.

@DEC_
판단.

@SOL_
해결.

@RES_
결과.
```

처음에는 이것만 써도 충분합니다.

## 3. 자주 쓰는 추가 카드

```md
@IMG=./images/example.webp|이미지 설명
@BA=./images/before.webp|./images/after.webp|50|전후 비교
@V=./videos/out.webm|영상 제목|poster=./images/poster.webp,muted=true,controls=true
@DEMO=sample-canvas|Sample Canvas|autoResize=true,minHeight=360,maxHeight=960
@REL_slug-a,slug-b
```

이미지, 영상, 데모, 관련 작업은 필요할 때만 꺼내는 카드입니다. 처음부터 다 외우지 않습니다.

## 4. 새 페이지 만들기

Works 페이지:

```powershell
npm run new:work:micro -- barun-story --title "바룬의 이야기"
```

일반 페이지:

```powershell
npm run new:page:micro -- guide markdown-guide --title "Markdown Guide"
```

생성 후 직접 여는 파일은 둘 중 하나입니다.

```txt
src/content/pages/works/<slug>/work.micro.md
src/content/pages/<section>/<slug>/page.micro.md
```

## 5. 작성 후 명령

평소에는 이것 하나만 실행합니다.

```powershell
npm run publish:content
```

내부 흐름은 이렇게 이해하면 됩니다.

```txt
micro compile
→ easy check
→ content validation
→ Vue build
```

직접 점검하고 싶을 때만 아래 명령을 따로 씁니다.

```powershell
npm run micro:compile
npm run micro:check
npm run easy:check
npm run build
```

## 6. 판단 기준

| 상황 | 추천 |
|---|---|
| 글처럼 자유롭게 쓰는 안내문 | 일반 Markdown |
| 작업 소개 / 포트폴리오 / 케이스스터디 | Micro Markdown |
| 이미지, 비교, 데모, 갤러리 많은 페이지 | Micro Markdown |
| 구조 없이 짧은 공지 | 일반 Markdown |

## 7. 기억할 것

```txt
Micro는 언어가 아니다.
Micro는 페이지 주문서다.
짧게 쓰고, 나머지는 컴파일한다.
```
