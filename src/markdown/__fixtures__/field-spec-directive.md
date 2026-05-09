::field-spec
name: work.status
type: draft | published | archived | private
required: true
tag: 필수
default: published
ssot: frontmatter.work.status
usedBy: Works collection visibility
::
Works 목록 표시 여부를 결정합니다.
::

::field-spec
name: thumbnail
type: image path
required: false
tag: 선택
default: ./images/thumb.webp
::
Works 카드 썸네일입니다.
::
