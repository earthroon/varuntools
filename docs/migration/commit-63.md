# Commit 63 — Store Taxonomy / Category Facet System

Commit 63 adds a dedicated store taxonomy layer for product catalog filtering and search indexing.

## Contract

```txt
product.type        = 제공 방식
product.category    = 스토어 매대
product.subcategory = 세부 매대
product.collection  = 브랜드/기획 묶음
product.series      = 연작/세트
tags                = 자유 검색 보조어
```

## Notes

- `status=published` remains forbidden.
- Unknown taxonomy values warn instead of failing validation.
- The dummy catalog is now a taxonomy/filter sample, not a real selling product.
