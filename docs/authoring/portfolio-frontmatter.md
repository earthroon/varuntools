# Portfolio frontmatter contract v2

Commit 90 introduces `frontmatter.work` as the SSOT for portfolio collection metadata.

The body can describe the case study through CSV blocks, but collection surfaces should read from `work` instead of scraping Markdown content.

## Preferred CSV authoring

Use `work.*` keys on the `page` row.

```csv
block,title,body,src,alt,caption,thumb,layout,kind,options,meta
page,VarunTools Store,"보안과 콘텐츠 발행이 분리된 포트폴리오형 스토어",./cover.webp,Cover,,./thumb.webp,,,"slug=works/varuntools-store; kind=work; status=active; visibility=public; work.type=case-study; work.status=published; work.featured=true; work.weight=90; work.role=[Design Engineer, Frontend]; work.stack=[Vue, TypeScript, Cloudflare Workers]; work.tags=[store, security, portfolio]; work.mood.tone=almond-paper",
```

## Output shape

```yaml
work:
  type: case-study
  status: published
  featured: true
  weight: 90
  year: 2026
  client: internal
  role:
    - Design Engineer
    - Frontend
  stack:
    - Vue
    - TypeScript
    - Cloudflare Workers
  tags:
    - store
    - security
    - portfolio
  mood:
    tone: almond-paper
    density: high
  links:
    demo: /demo
```

## SSOT priority

```txt
page.options.work.* > page legacy work-like options > portfolio-hero fallback > no work object
```

`portfolio-hero` is a fallback only. It should not override `page.options.work.*`.

## Safety rule

A product or general page that only has root `tags`, `featured`, or `weight` does not automatically receive `frontmatter.work`. The page must be explicitly work-authored or include a portfolio hero.

## Validation

```bash
npm run smoke:portfolio-frontmatter
npm run smoke:csv-portfolio-blocks
npm run smoke:csv-options
npm run csv:pages
```

## Commit 92 — Works collection usage

The `/works` collection consumes `frontmatter.work` directly.

Collection filters use:

- `work.type`
- `work.role`
- `work.stack`
- `work.tags`
- `work.year`
- `work.featured`

Default ordering uses:

```txt
featured desc → weight desc → year desc → order asc → title asc
```

Visibility:

- `work.status: private` is hidden.
- `work.status: draft` is hidden by default.
- `work.status: archived` can remain visible with an archived badge.

## Workflow reference

For the complete authoring flow from preset creation to publish checklist, see `docs/authoring/portfolio-authoring-v2.md`.
