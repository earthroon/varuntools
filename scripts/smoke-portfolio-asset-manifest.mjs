#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { buildPortfolioAssetManifest, createPortfolioAssetEntry } from './lib/portfolio-asset-manifest.mjs'

const root = process.cwd()
const failures = []
function check(name, condition, detail = '') {
  if (!condition) failures.push(detail ? `${name}: ${detail}` : name)
}
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8') }
function exists(file) { return fs.existsSync(path.join(root, file)) }

check('portfolio asset manifest lib exists', exists('scripts/lib/portfolio-asset-manifest.mjs'))
check('build script exists', exists('scripts/build-portfolio-asset-manifest.mjs'))
check('generated manifest exists', exists('src/content/generated/portfolio-asset-manifest.json'))

const pkg = JSON.parse(read('package.json'))
check('build:portfolio-assets script exists', pkg.scripts?.['build:portfolio-assets'] === 'node scripts/build-portfolio-asset-manifest.mjs')
check('smoke:portfolio-asset-manifest script exists', pkg.scripts?.['smoke:portfolio-asset-manifest'] === 'node scripts/smoke-portfolio-asset-manifest.mjs')
check('check-launch includes build:portfolio-assets', read('scripts/check-launch.mjs').includes('build-portfolio-asset-manifest.mjs'))
check('check-launch includes smoke:portfolio-asset-manifest', read('scripts/check-launch.mjs').includes('smoke-portfolio-asset-manifest.mjs'))

const source = read('scripts/lib/portfolio-asset-manifest.mjs')
for (const code of [
  'PORTFOLIO_ASSET_LARGE_IMAGE',
  'PORTFOLIO_ASSET_LARGE_VIDEO',
  'PORTFOLIO_ASSET_LARGE_SVG',
  'PORTFOLIO_ASSET_UNKNOWN_EXTENSION',
  'PORTFOLIO_ASSET_EXTERNAL_UNMANAGED',
]) check(`warning code ${code} is defined`, source.includes(code))

const manifest = JSON.parse(read('src/content/generated/portfolio-asset-manifest.json'))
check('manifest version is 1', manifest.version === 1)
check('manifest assets is array', Array.isArray(manifest.assets))
check('manifest summary exists', Boolean(manifest.summary && typeof manifest.summary.total === 'number'))
check('manifest has at least one asset', manifest.assets.length > 0)
check('manifest has cover role', manifest.assets.some((asset) => asset.role === 'cover'))
check('manifest has gallery role', manifest.assets.some((asset) => asset.role === 'gallery'))
check('manifest does not contain node_modules', !JSON.stringify(manifest).includes('node_modules'))
check('manifest does not contain .git', !JSON.stringify(manifest).includes('.git'))
check('manifest does not leak object strings', !JSON.stringify(manifest).includes('[object Object]'))

const rebuilt = buildPortfolioAssetManifest({ projectRoot: root, csvPaths: ['src/content/pages/products/dummy-catalog/page.csv'], generatedAt: 'smoke' })
check('buildPortfolioAssetManifest returns version 1', rebuilt.version === 1)
check('buildPortfolioAssetManifest counts assets', rebuilt.summary.total > 0)

const heroEntry = createPortfolioAssetEntry({ block: 'portfolio-hero', field: 'src', value: './cover.svg' }, { sourceCsvPath: 'src/content/pages/works/demo/page.csv', projectRoot: root })
check('portfolio hero cover is eager', heroEntry.role === 'cover' && heroEntry.loading === 'eager' && heroEntry.priority === 'high')

const galleryEntry = createPortfolioAssetEntry({ block: 'case-gallery-item', field: 'src', value: './gallery.svg' }, { sourceCsvPath: 'src/content/pages/works/demo/page.csv', projectRoot: root })
check('case gallery asset is lazy gallery', galleryEntry.role === 'gallery' && galleryEntry.loading === 'lazy' && galleryEntry.priority === 'low')

const portfolioHero = read('src/components/portfolio/PortfolioHero.vue')
check('PortfolioHero uses eager loading', portfolioHero.includes('loading="eager"'))
check('PortfolioHero uses decoding async', portfolioHero.includes('decoding="async"'))
check('PortfolioHero uses fetchpriority high', portfolioHero.includes('fetchpriority="high"'))

const caseGallery = read('src/components/portfolio/CaseGallery.vue')
check('CaseGallery uses lazy loading', caseGallery.includes('loading="lazy"'))
check('CaseGallery uses decoding async', caseGallery.includes('decoding="async"'))

const caseGalleryItem = read('src/components/portfolio/CaseGalleryItem.vue')
check('CaseGalleryItem uses lazy loading', caseGalleryItem.includes('loading="lazy"'))
check('CaseGalleryItem uses decoding async', caseGalleryItem.includes('decoding="async"'))

const workCard = read('src/components/markdown/WorkCard.vue')
check('WorkCard uses lazy loading', workCard.includes('loading="lazy"'))
check('WorkCard uses decoding async', workCard.includes('decoding="async"'))

const homeFeatured = read('src/components/home/HomeFeaturedWorks.vue')
check('HomeFeaturedWorks reuses WorkCard', homeFeatured.includes('WorkCard'))

if (failures.length) {
  console.error('smoke:portfolio-asset-manifest FAILED')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
console.log(`[smoke:portfolio-asset-manifest] OK - manifest assets=${manifest.assets.length}`)
