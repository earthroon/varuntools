# Portfolio editorial layout QA

## Purpose

Commit 123 hardens the editorial layout rhythm without redesigning the editorial directives.

## Responsive rules

Desktop keeps 2-column and 3-column layouts. Tablet can collapse `collapse: tablet` blocks. Mobile collapses all non-`never` editorial columns to one column.

## Long text rules

Long headings, subtitles, URLs, and column text should wrap inside the content width. The CSS uses `min-width: 0`, `max-width: 100%`, `overflow-wrap: anywhere`, and `overflow-x: clip` guards.

## Accessibility rule

Visual heading level and actual heading tag remain separate. `level: major` can render as `h2` when the page already owns `h1`.

## Overuse rule

Use editorial blocks only where the page needs editorial rhythm. Existing Markdown headings remain valid.
