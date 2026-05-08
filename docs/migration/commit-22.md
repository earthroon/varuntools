# Commit 22 Migration Notes

## Old

SuperBoxParser / NotePulse external DOM scripts.

## New

```md
::markdown-box
type: note
title: 설계 메모
::
내용
::
```

## Rule

Do not restore Super/Notion DOM scanners or CDN scripts. Use `markdown-box` as the content SSOT.

## Legacy intake

Supported migration input:

```md
> [!warning] 주의
> DOM 스캐너로 되돌리지 않는다.
```

This is transformed before markdown-it rendering into `::markdown-box`.
