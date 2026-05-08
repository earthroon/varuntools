#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { defaultOgAssetExists, siteConfig } from './lib/seo-pages.mjs'
const root = process.cwd()
const checks = []
function check(name, ok) { checks.push([name, Boolean(ok)]) }
function read(file) { return readFileSync(path.join(root, file), 'utf8') }
check('site origin is varun.tools', siteConfig.origin === 'https://varun.tools')
check('default OG asset exists', defaultOgAssetExists(root))
check('robots.txt exists', existsSync(path.join(root, 'public', 'robots.txt')))
check('robots references sitemap', read('public/robots.txt').includes('https://varun.tools/sitemap.xml'))
check('generate sitemap script exists', existsSync(path.join(root, 'scripts', 'generate-sitemap.mjs')))
check('audit seo script exists', existsSync(path.join(root, 'scripts', 'audit-seo.mjs')))
check('index default og image', read('index.html').includes('https://varun.tools/og/default-og.svg'))
check('index canonical', read('index.html').includes('<link rel="canonical" href="https://varun.tools"'))
check('site config TS exists', existsSync(path.join(root, 'src', 'site', 'siteConfig.ts')))
check('seo resolver TS exists', existsSync(path.join(root, 'src', 'site', 'seo.ts')))
check('dist sitemap exists', existsSync(path.join(root, 'dist', 'sitemap.xml')))
if (existsSync(path.join(root, 'dist', 'sitemap.xml'))) {
  const sitemap = read('dist/sitemap.xml')
  check('sitemap includes home', sitemap.includes('<loc>https://varun.tools</loc>') || sitemap.includes('<loc>https://varun.tools/</loc>'))
  check('sitemap includes works', sitemap.includes('<loc>https://varun.tools/works</loc>'))
  check('sitemap includes markdown gallery', sitemap.includes('<loc>https://varun.tools/lab/markdown-gallery</loc>'))
}
const failed = checks.filter(([, ok]) => !ok)
if (failed.length) { for (const [name] of failed) console.error(`[seo] missing: ${name}`); process.exit(1) }
console.log(`[seo] OK — ${checks.length} checks`)
