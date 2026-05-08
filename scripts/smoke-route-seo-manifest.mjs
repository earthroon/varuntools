#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const files = {
  types: path.join(root, 'src/site/seoTypes.ts'),
  defaults: path.join(root, 'src/site/seoDefaults.ts'),
  manifest: path.join(root, 'src/site/routeSeoManifest.ts'),
  seo: path.join(root, 'src/site/seo.ts'),
  publicSearch: path.join(root, 'src/content/generated/page-search-index.json'),
  docs: path.join(root, 'docs/authoring/route-seo-metadata.md'),
  migration: path.join(root, 'docs/migration/commit-135.md'),
  report: path.join(root, 'BAKE_REPORT_COMMIT_135.md'),
}

const fail = (message) => {
  console.error(`[smoke:route-seo-manifest] FAIL ${message}`)
  process.exit(1)
}

for (const [name, filePath] of Object.entries(files)) {
  if (!fs.existsSync(filePath)) fail(`${name} missing: ${filePath}`)
}

const manifestSource = fs.readFileSync(files.manifest, 'utf8')
const seoSource = fs.readFileSync(files.seo, 'utf8')
const typeSource = fs.readFileSync(files.types, 'utf8')
const defaultSource = fs.readFileSync(files.defaults, 'utf8')
const allSource = [manifestSource, seoSource, typeSource, defaultSource].join('\n')

for (const token of [
  'RouteSeoMeta',
  'RouteSeoManifest',
  'SeoRobotsDirective',
  'siteSeoDefaults',
  'routeSeoManifest',
  'createCanonicalUrl',
  'absolutizeOgImage',
  'https://varun.tools',
  'defaultOgImage',
]) {
  if (!allSource.includes(token)) fail(`missing token: ${token}`)
}

const requiredRoutes = [
  '/',
  '/works',
  '/works/varuntools-showroom',
  '/products',
  '/products/categories',
  '/products/categories/templates',
  '/wiper',
  '/lab-markdown-gallery',
]
for (const route of requiredRoutes) {
  if (!manifestSource.includes(`route: '${route}'`)) fail(`manifest missing route: ${route}`)
}

for (const forbidden of [
  '/works/editorial-showcase',
  '/products/dummy-catalog',
  '/products/spec-playground',
  '/checkout/success',
  '/checkout/fail',
  '/qa/ewa-gallery',
  '/claim',
]) {
  if (manifestSource.includes(`route: '${forbidden}'`) || manifestSource.includes(`\"${forbidden}\"`)) {
    fail(`forbidden route leaked into SEO manifest: ${forbidden}`)
  }
}

const searchIndex = JSON.parse(fs.readFileSync(files.publicSearch, 'utf8'))
const items = Array.isArray(searchIndex) ? searchIndex : searchIndex.items || []
const searchHrefs = new Set(items.map((item) => item.href))
for (const href of searchHrefs) {
  if (!requiredRoutes.includes(href)) fail(`public search route lacks SEO metadata: ${href}`)
}

for (const route of requiredRoutes) {
  const chunkPattern = new RegExp(`['\"]${route === '/' ? '/' : route}['\"]:\\s*\\{[\\s\\S]*?description:`, 'm')
  const routePattern = new RegExp(`route:\\s*['\"]${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['\"][\\s\\S]*?description:`, 'm')
  if (!routePattern.test(manifestSource) && !chunkPattern.test(manifestSource)) {
    fail(`route lacks description: ${route}`)
  }
}

if (allSource.includes('[object Object]')) fail('object serialization leak detected')

console.log(`[smoke:route-seo-manifest] OK ${requiredRoutes.length} route metadata entries verified`)
