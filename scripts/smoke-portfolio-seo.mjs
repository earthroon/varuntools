#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { buildAndWritePortfolioSeo } from './lib/portfolio-seo.mjs'

const root = process.cwd()
const checks = []
function check(name, ok) { checks.push([name, Boolean(ok)]) }
function read(file) { return readFileSync(path.join(root, file), 'utf8') }
function exists(file) { return existsSync(path.join(root, file)) }

const result = buildAndWritePortfolioSeo({ projectRoot: root, origin: 'https://varun.tools' })
const manifestPath = 'src/content/generated/portfolio-seo-manifest.json'
const sitemapPath = 'public/sitemap.xml'
const robotsPath = 'public/robots.txt'

check('build:portfolio-seo script exists', JSON.parse(read('package.json')).scripts?.['build:portfolio-seo'] === 'node scripts/build-portfolio-seo.mjs')
check('smoke:portfolio-seo script exists', JSON.parse(read('package.json')).scripts?.['smoke:portfolio-seo'] === 'node scripts/smoke-portfolio-seo.mjs')
check('portfolio-seo lib exists', exists('scripts/lib/portfolio-seo.mjs'))
check('portfolio seo manifest generated', exists(manifestPath))
check('sitemap generated', exists(sitemapPath))
check('robots generated', exists(robotsPath))

const manifest = JSON.parse(read(manifestPath))
const sitemap = read(sitemapPath)
const robots = read(robotsPath)
const lib = read('scripts/lib/portfolio-seo.mjs')
const launch = read('scripts/check-launch.mjs')

check('manifest version is 1', manifest.version === 1)
check('manifest pages array exists', Array.isArray(manifest.pages))
check('manifest summary exists', manifest.summary && typeof manifest.summary.total === 'number')
check('manifest has indexable pages', manifest.summary.indexable > 0)
check('canonicalUrl uses varun.tools', manifest.pages.filter((page) => page.indexable).every((page) => page.canonicalUrl.startsWith('https://varun.tools')))
check('indexable entries have title', manifest.pages.filter((page) => page.indexable).every((page) => page.title && typeof page.title === 'string'))
check('indexable entries have description or warning', manifest.pages.filter((page) => page.indexable).every((page) => page.description || page.warningCodes.includes('PORTFOLIO_SEO_MISSING_DESCRIPTION')))
check('sitemap contains varun.tools canonical urls', sitemap.includes('<loc>https://varun.tools'))

check('SEO manifest includes tag entries when tag index exists', !exists('src/content/generated/portfolio-tag-index.json') || manifest.pages.some((entry) => entry.type === 'tag' && entry.href.startsWith('/works/tags/')))
check('sitemap includes tag landing pages when generated', !exists('src/content/generated/portfolio-tag-index.json') || sitemap.includes('https://varun.tools/works/tags/'))
check('tag canonical URLs use works tags path', manifest.pages.filter((entry) => entry.type === 'tag').every((entry) => entry.canonicalUrl.includes('/works/tags/')))
check('sitemap excludes search query URLs', !sitemap.includes('/search?q='))
check('sitemap does not include checkout success noindex page', !sitemap.includes('/checkout/success'))
check('sitemap does not include checkout fail noindex page', !sitemap.includes('/checkout/fail'))
check('robots references sitemap', robots.includes('Sitemap: https://varun.tools/sitemap.xml'))
check('lib has title fallback', lib.includes('resolveSeoTitle'))
check('lib has description fallback', lib.includes('resolveSeoDescription'))
check('lib has image fallback', lib.includes('resolveSeoImage'))
check('lib has sitemap renderer', lib.includes('renderSitemapXml'))
check('lib defines draft/private warning codes', lib.includes('PORTFOLIO_SEO_DRAFT_INDEXED') && lib.includes('PORTFOLIO_SEO_PRIVATE_INDEXED'))
check('launch runs build:portfolio-seo', launch.includes('scripts/build-portfolio-seo.mjs'))
check('launch runs smoke:portfolio-seo', launch.includes('scripts/smoke-portfolio-seo.mjs'))
check('generated files contain no object leakage', !`${read(manifestPath)}\n${sitemap}\n${robots}`.includes('[object Object]'))
check('build result returns same manifest shape', result.manifest.version === 1 && result.entries.length === manifest.pages.length)

const failed = checks.filter(([, ok]) => !ok)
if (failed.length) {
  for (const [name] of failed) console.error(`[smoke:portfolio-seo] FAIL ${name}`)
  process.exit(1)
}
console.log(`[smoke:portfolio-seo] OK - ${checks.length} checks`)
