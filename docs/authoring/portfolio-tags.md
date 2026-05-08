# Portfolio Tags

Commit 106 promotes `frontmatter.work.tags` / Works metadata tags from a filter value into shareable portfolio tag landing pages.

## SSOT

Tag landing pages are generated from portfolio work metadata:

```yaml
work:
  tags:
    - csv
    - portfolio
    - security
```

Legacy/root `tags` on work pages are also read through the normalized Works collection path so older work pages remain searchable. The generated tag index is not a manual source of truth.

```txt
Source: frontmatter.work.tags / work page tags
Generated: src/content/generated/portfolio-tag-index.json
```

Do not edit `portfolio-tag-index.json` by hand. Update the page metadata and regenerate it.

## Commands

```bash
npm run build:portfolio-tags
npm run smoke:portfolio-tags
npm run build:portfolio-seo
npm run smoke:portfolio-seo
```

Build order matters:

```txt
build:portfolio-tags -> build:portfolio-seo
```

SEO and sitemap output need the tag index before they can include tag landing pages.

## URL structure

```txt
/works/tags/:tag
```

Examples:

```txt
/works/tags/vue
/works/tags/security
/works/tags/색감-보정
```

## Slug rules

Tags keep a readable URL form.

```txt
Cloudflare Workers -> cloudflare-workers
UI/UX              -> ui-ux
색감 보정          -> 색감-보정
브랜딩             -> 브랜딩
```

Korean tags are preserved. Sitemap output is generated as URL text and should remain valid for static hosting that supports encoded UTF-8 paths.

## Visibility policy

Included:

- published works
- archived works

Excluded:

- draft works
- private works
- hidden visibility
- empty tag entries

Draft/private content must not appear in the tag index, the tag landing page, or the sitemap.

## Search relationship

These are separate surfaces:

```txt
/works?q=vue       -> temporary Works search/filter state
/search?q=vue      -> site-wide page search
/works/tags/vue    -> shareable portfolio tag landing page
```

Do not collapse those into one state object. The first two are search states. The third is a generated route derived from work metadata.

## SEO relationship

Tag pages are included in SEO and sitemap output when:

```txt
tag.count > 0
tag.indexable === true
```

Query search URLs are still excluded from the sitemap:

```txt
/search?q=vue  -> not included
```


## Publish gate relation

`npm run check:publish` reads `portfolio-tag-index.json` to verify that tagged public works are represented in the tag index.
