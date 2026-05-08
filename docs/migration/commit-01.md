# Commit 01 — Vite/Vue/VARUNTOOLS Extended Markdown Scaffold

## Purpose

Build the first runnable scaffold for VARUNTOOLS as a Vite + Vue + TypeScript app whose page content SSOT is Markdown.

## Scope

- Vite/Vue/TypeScript app shell
- Router pages
- Markdown content loading through `import.meta.glob`
- Frontmatter parsing through `gray-matter`
- Markdown rendering through `markdown-it`
- Extended Markdown v0 rule documentation
- CSS layer placeholders

## Explicitly out of scope

- Real directive parser implementation
- Custom element bridge
- Before/After Wiper component implementation
- Legacy Super/Notion DOM runtime
- GitHub deploy workflow

## Done criteria

- `npm install`
- `npm run dev`
- `/`, `/works`, `/tools/wiper` routes exist
- Markdown content renders as HTML
- Frontmatter parses
- GIF/image Markdown examples exist
- WebM/directive rules are documented, not yet executed
