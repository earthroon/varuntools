# Invalid editorial fixture

This fixture is intentionally invalid. It is excluded from the default validation scan and used only with `--expect-invalid`.

::editorial-title
level: huge
as: div
title: 잘못된 레벨과 태그
::

::editorial-title
level: major
as: h2
::

::editorial-columns
cols: 4
gap: massive
collapse: desktop
::
### 하나

내용이 있다.
::

::editorial-columns
cols: 2
gap: md
collapse: mobile
::
### 왼쪽

내용이 있다.

---

::

Literal object leak guard: [object Object]
