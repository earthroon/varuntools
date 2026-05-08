# Commit 38 — Lightbox Metadata Panel / Image Action Bar

## Purpose

Adds image metadata and action controls to the lightbox.

## Features

- Title / caption / index display
- Source and gallery group display
- Info toggle
- Open original
- Copy gallery image link
- `#vt-gallery=group:index` hash deep link support

## Gallery metadata syntax

```md
::gallery-strip
title: Manual Metadata Gallery
layout: strip
::
- ./images/a.svg | Caption A | ./images/a.svg | title=Draft A; tool=Figma; tag=draft
::
```

## Rule

Do not invent metadata. Display only metadata from Markdown/gallery items.
