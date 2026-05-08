# Portfolio Editorial Showcase

Commit 125 adds a preview surface for portfolio editorial blocks. The showcase is not a new block system. It is a page and fixture that let an author inspect the existing `editorial-title` and `editorial-columns` flows in one place.

## Purpose

Use the showcase to check whether major, middle, and minor heading hierarchy reads clearly, whether 2-column and 3-column layouts collapse correctly, and whether long text stays inside the grid.

## Preview sections

- Major / middle / minor heading preview
- Problem / solution 2-column preview
- Emotion / structure / technology 3-column preview
- Long title and long column token preview
- Existing Markdown heading behavior preservation

## Recommended QA flow

1. Open the editorial showcase page.
2. Check desktop spacing and title hierarchy.
3. Check tablet collapse for 3-column examples.
4. Check mobile collapse for every column layout.
5. Confirm no horizontal scroll appears.
6. Confirm normal Markdown headings still read as part of the page.

## Exposure policy

The initial showcase page is a hidden/private preview surface. It should not be treated as a public portfolio card until the visual density and authoring examples are intentionally promoted.

## Boundary

No editorial parser rewrite. No new editorial block type. No inquiry system change. No external screenshot regression dependency.
