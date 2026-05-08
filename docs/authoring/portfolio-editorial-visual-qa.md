# Portfolio editorial visual QA

## Purpose

The editorial block system already exists. This guide checks whether it survives real visual pressure: long headings, long subtitles, 2/3-column layouts, tablet collapse, mobile collapse, and mixed Markdown headings.

## Visual QA fixture

```txt
src/markdown/__fixtures__/portfolio-editorial-visual-qa.md
```

## Desktop checklist

```txt
- 2-column layouts remain balanced.
- 3-column layouts stay inside the content width.
- Long headings wrap instead of overflowing.
- Subtitle rhythm does not crush the following body content.
```

## Tablet checklist

```txt
- collapse: tablet sections collapse before the layout becomes cramped.
- 3-column layouts do not create horizontal scroll.
- Gap rhythm still feels intentional after collapse.
```

## Mobile checklist

```txt
- All non-never editorial columns collapse to one column.
- Reading order follows the original Markdown order.
- Long URLs or long tokens wrap inside the column.
- No horizontal scroll appears.
```

## Accessibility checklist

```txt
- visual level and HTML heading tag remain separate.
- major can render as h2 when the page already owns h1.
- middle can render as h3.
- minor can render as h4.
- Existing Markdown # / ## / ### headings remain valid.
```

## Long title criteria

Long titles should wrap cleanly and preserve rhythm.

## Column overflow criteria

Column content fails QA if a URL forces horizontal scroll, a grid item refuses to shrink, or mobile layout keeps multiple columns.

## No external visual regression service

Commit 124 does not add Playwright image snapshots or an external visual regression service. The guard is intentionally lightweight: fixture + content validation + smoke scripts.
