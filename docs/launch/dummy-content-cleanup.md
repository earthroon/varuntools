# Dummy Content Cleanup

Commit 66 does not silently delete demo pages. Demo pages are launch-sensitive content and must be handled deliberately.

## Current demo product pages

```txt
/products/dummy-catalog
/products/spec-playground
```

## Options

### A. Replace with real products

Keep the route and edit the CSV/frontmatter into a real product.

### B. Hide before launch

Set:

```yaml
visibility: hidden
featured: false
product:
  status: hidden
```

Then run:

```bash
npm run generate:search-index
npm run validate:content
npm run audit:launch-readiness
```

### C. Delete before launch

```bash
rm -rf src/content/pages/products/dummy-catalog
rm -rf src/content/pages/products/spec-playground
npm run generate:search-index
npm run validate:content
npm run smoke:product-catalog
npm run audit:launch-readiness
```

### D. Keep as prelaunch demos

This is allowed only while:

```ts
launchMode: 'prelaunch'
allowDemoProducts: true
```

In `launch-candidate` or `production`, demo products should become blockers unless explicitly accepted by the launch owner.
