---
showInNav: false
template: "visual-case"
layoutIntent: "visual-portfolio"
scaffold: "{\"presetId\":\"visual-case\",\"generatedBy\":\"cms117-portfolio-demo-scaffold-editor\",\"blockCount\":8}"
schema: "{\"packId\":\"post\",\"packVersion\":\"cms-schema-pack-v1\"}"
kind: "page"
visibility: "public"
exposure: "{\"route\":true,\"home\":false,\"collection\":\"page\",\"search\":true,\"sitemap\":true,\"nav\":false,\"featured\":false,\"routeOnly\":false}"
layout: "default"
navLabel: ""
publishedDate: ""
series: ""
mood: ""
relatedLinks: []
tags: []
category: "post"
status: "active"
noindex: false
robots: "index,follow"
title: "제본 시뮬레이터 & 인쇄조건 테스트"
summary: "제본 시뮬레이터로 내지구성을 확인하고 \n인쇄조건을 여러방법으로 테스트해서 사고를 막았습니다."
slug: "post/printtest"
source: "vacms"
vacmsSlug: "printtest"
vacmsPageId: "page_328a307b1b71f96f4a4f7bcd"
vacmsRevisionId: "rev_1a1b494b8779eedb752a2293"
vacmsProjectionSchema: "vacms-public-projection@1"
vacmsPublicSnapshotSchema: "vacms-public-materialization-snapshot@1"
vacmsPublicSnapshotHash: "sha256:cdf5110ac77e0ea4d1cc243082e10d63d7e6856fde1a0cc97a3c94997f3dd31e"
---

















::editorial-title
title: 제본 시뮬레이터 & 인쇄조건 테스트
subtitle: 일반적인 뷰어로는 책의 물성(두께, 굴곡, 제본 안쪽 말림)을예측할 수 없어, 인쇄 후 레이아웃 사고가 빈번히 발생했습니다. 인디자인의 PDF 파일을 WebGPU 기반 3D 공간으로 옮겨. 디자이너가 인쇄소에 파일을 넘기기 전,  즉시 최종 형태를 검수할 수 있는 환경을 구축했습니다.
::





::image-card
id: image-card-1
src: /assets/content/page_328a307b1b71f96f4a4f7bcd/asset_7a5d991f5a7af5ee81bd17df/out.gif
assetId: asset_7a5d991f5a7af5ee81bd17df
alt: Manual image alt text
caption: 제본 시뮬레이터 예시
ratio: 16:9
::



::image-card
id: image-card-1
title: 인디자인 PDF 예시
src: /assets/content/page_328a307b1b71f96f4a4f7bcd/asset_d9ef96c274ed92ba80b35289/webp
assetId: asset_d9ef96c274ed92ba80b35289
alt: 인디자인 PDF 예시
caption: 인디자인 PDF 예시
ratio: 1:1
::

::section-gap


::editorial-title
title: 출력조건 확인
subtitle: 흑백 인쇄 시 그레이 채널 단독으로 출력하지 않음을 잡아 내, 본 제작 전에 컬러 불량을 막아냄.  (K 단색이 아닌 CMYK혼합으로 출력하면 특정 색이 녹아나옵니다.)
::

::editorial-columns
::
### 흑백출력
그레이 채널로 수정해서 출력했습니다

### 4도출력
혼합회색으로 4도출력해서 특정 색이 녹아나왔습니다.
::


::before-after
before: /assets/content/page_328a307b1b71f96f4a4f7bcd/asset_79f0e0f155bc0da7c7f6296c/2.webp
beforeAssetId: asset_79f0e0f155bc0da7c7f6296c
after: /assets/content/page_328a307b1b71f96f4a4f7bcd/asset_6caccfed6398e11d4098cafb/2.webp
afterAssetId: asset_6caccfed6398e11d4098cafb
caption: 올바른 출력/ 불량 출력
initial: 50
::
