# Gallery Authoring

Images are grouped by visual section boundaries such as `section-gap` and `hr`.

```md
![A](./images/a.webp "[필수] A")
![B](./images/b.webp "[선택] B")

::section-gap
::

![C](./images/c.webp "[기타] C")
```

Auto mini gallery can be controlled by frontmatter:

```yaml
gallery:
  autoMini: true
```

Manual gallery-strip:

```md
::gallery-strip
title: Manual Gallery
caption: Curated gallery sample.
layout: strip
lightbox: true
::
- ./images/a.webp | Caption A | ./images/a.webp | title=Draft A; tool=Figma; tag=draft
- ./images/b.webp | Caption B | ./images/b.webp | title=Final B; tool=Photoshop; tag=final
::
```

Layouts: `strip`, `grid`, `compact`.
