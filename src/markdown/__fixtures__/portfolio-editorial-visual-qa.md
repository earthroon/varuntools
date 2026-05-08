# 기존 마크다운 제목은 유지된다

이 fixture는 브라우저에서 눈으로 확인할 수 있는 editorial visual QA 샘플이다. 실제 렌더링 화면에서 제목 위계, 긴 텍스트, 2/3칼럼, collapse 흐름을 빠르게 확인하기 위한 기준이다.

::editorial-title
level: major
as: h2
kicker: VISUAL QA
title: 긴 대제목이 들어와도 포트폴리오 editorial title은 화면 밖으로 밀려나지 않아야 한다
subtitle: subtitle은 길어져도 줄바꿈되며, 본문 리듬을 찢지 않고 아래 흐름과 자연스럽게 연결되어야 한다.
::

::editorial-title
level: middle
as: h3
title: 문제와 해결을 2칼럼으로 비교한다
subtitle: 데스크톱에서는 좌우 비교, 모바일에서는 DOM 순서를 따라 한 줄 흐름으로 접힌다.
::

::editorial-columns
cols: 2
gap: md
collapse: mobile
::
### 문제

포트폴리오 설명이 긴 문장과 긴-토큰-긴-토큰-긴-토큰-긴-토큰을 만나도 가로 스크롤을 만들면 안 된다.

---
### 해결

column 내부 텍스트는 overflow-wrap 기준으로 줄바꿈되고, grid item은 min-width: 0으로 화면 폭 안에 남아야 한다.
::

::editorial-title
level: minor
as: h4
title: 감정 / 구조 / 기술 3칼럼
::

::editorial-columns
cols: 3
gap: lg
collapse: tablet
::
### 감정

사용자가 먼저 느끼는 압력과 결핍을 설명한다.

---
### 구조

그 감각이 어디에 저장되고 어떤 순서로 처리되는지 보여준다.

---
### 기술

실제로 작동하는 렌더링, 검증, 저장, 상태 전환 로직을 설명한다. 긴 URL 후보 https://varun.tools/portfolio/editorial-visual-qa-long-token-example 도 칼럼 내부에서 줄바꿈되어야 한다.
::

## 일반 마크다운 heading도 계속 살아 있다

editorial block은 기존 heading을 대체하지 않는다. 특별히 조판 리듬이 필요한 구간에만 얹는다.
