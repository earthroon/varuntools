#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import {
  buildAndWritePortfolioTagIndex,
  buildPortfolioTagEntries,
  createPortfolioTagSlug,
  normalizePortfolioTag,
} from './lib/portfolio-tags.mjs'
import { buildAndWritePortfolioSeo } from './lib/portfolio-seo.mjs'

const root = process.cwd()
const checks = []
function check(name, condition) { checks.push([name, Boolean(condition)]) }
function read(file) { return readFileSync(path.join(root, file), 'utf8') }
function exists(file) { return existsSync(path.join(root, file)) }

const pkg = JSON.parse(read('package.json'))
const tagResult = buildAndWritePortfolioTagIndex({ projectRoot: root })
buildAndWritePortfolioSeo({ projectRoot: root, origin: 'https://varun.tools' })

const indexPath = 'src/content/generated/portfolio-tag-index.json'
const index = JSON.parse(read(indexPath))
const router = read('src/router/index.ts')
const reserved = read('src/router/reservedRoutes.ts')
const tagPage = read('src/pages/WorksTagPage.vue')
const landing = read('src/components/works/WorksTagLanding.vue')
const lib = read('scripts/lib/portfolio-tags.mjs')
const seoLib = read('scripts/lib/portfolio-seo.mjs')
const seoSmoke = read('scripts/smoke-portfolio-seo.mjs')
const launch = read('scripts/check-launch.mjs')
const sitemap = read('public/sitemap.xml')
const seoManifest = JSON.parse(read('src/content/generated/portfolio-seo-manifest.json'))

check('build:portfolio-tags script exists', pkg.scripts?.['build:portfolio-tags'] === 'node scripts/build-portfolio-tags.mjs')
check('smoke:portfolio-tags script exists', pkg.scripts?.['smoke:portfolio-tags'] === 'node scripts/smoke-portfolio-tags.mjs')
check('portfolio-tags lib exists', exists('scripts/lib/portfolio-tags.mjs'))
check('build script exists', exists('scripts/build-portfolio-tags.mjs'))
check('tag index generated', exists(indexPath))
check('tag index version is 1', index.version === 1)
check('tags array exists', Array.isArray(index.tags))
check('tag index summary exists', index.summary && typeof index.summary.totalTags === 'number')
check('tag slug normalize function exists', lib.includes('createPortfolioTagSlug'))
check('Korean tag is preserved in slug normalize', createPortfolioTagSlug('색감 보정') === '색감-보정')
check('UI/UX tag normalizes safely', createPortfolioTagSlug('UI/UX') === 'ui-ux')
check('tag text normalizes NFKC', normalizePortfolioTag('  Cloudflare   Workers  ') === 'Cloudflare Workers')
check('draft/private mock excluded', buildPortfolioTagEntries([
  { slug: 'works/live', frontmatter: { kind: 'work', status: 'active', visibility: 'public', tags: ['live'] } },
  { slug: 'works/draft', frontmatter: { kind: 'work', work: { status: 'draft', tags: ['hidden'] } } },
  { slug: 'works/private', frontmatter: { kind: 'work', work: { status: 'private', tags: ['hidden'] } } },
]).every((entry) => !entry.works.includes('works/draft') && !entry.works.includes('works/private')))
check('empty tag entries not generated', !index.tags.some((entry) => entry.count <= 0 || !entry.indexable))
check('WorksTagPage exists', exists('src/pages/WorksTagPage.vue'))
check('WorksTagLanding exists', exists('src/components/works/WorksTagLanding.vue'))
check('works tag route exists', router.includes("path: '/works/tags/:tag'") && router.includes("name: 'works-tag'"))
check('reserved route includes works tag prefix', reserved.includes("name: 'works-tags'") && reserved.includes("path: 'works/tags'"))
check('WorksTagPage imports generated tag index', tagPage.includes('portfolio-tag-index.json'))
check('WorksTagPage uses route params', tagPage.includes('route.params.tag'))
check('WorksTagPage resolves WorkCard entries', tagPage.includes('getWorkCollectionEntries'))
check('WorksTagLanding reuses WorkCard', landing.includes('WorkCard'))
check('WorksTagLanding has empty state', landing.includes('해당 태그의 작업이 없습니다'))
check('tag styles exist', exists('src/styles/works-tags.css') && read('src/main.ts').includes("./styles/works-tags.css"))
check('tag SEO integration exists', seoLib.includes('createPortfolioTagSeoEntries') && seoLib.includes('readPortfolioTagIndex'))
check('SEO manifest includes tag entries when tags exist', index.tags.length === 0 || seoManifest.pages.some((entry) => entry.type === 'tag' && entry.href.startsWith('/works/tags/')))
check('sitemap includes indexable tag pages when tags exist', index.tags.length === 0 || sitemap.includes('https://varun.tools/works/tags/'))
check('sitemap excludes search query URLs', !sitemap.includes('/search?q='))
check('SEO smoke checks tag pages', seoSmoke.includes('works/tags') && seoSmoke.includes('type === \'tag\''))
check('check-launch builds tags before seo', launch.indexOf('scripts/build-portfolio-tags.mjs') > -1 && launch.indexOf('scripts/build-portfolio-tags.mjs') < launch.indexOf('scripts/build-portfolio-seo.mjs'))
check('check-launch runs smoke:portfolio-tags', launch.includes('scripts/smoke-portfolio-tags.mjs'))
check('tag index contains no object leakage', !read(indexPath).includes('[object Object]'))
check('source contains no object leakage', ![tagPage, landing, lib].join('\n').includes('[object Object]'))
check('build result matches generated index', tagResult.index.version === 1 && tagResult.index.tags.length === index.tags.length)

const failed = checks.filter(([, ok]) => !ok)
if (failed.length) {
  for (const [name] of failed) console.error(`[smoke:portfolio-tags] FAIL ${name}`)
  process.exit(1)
}
console.log(`[smoke:portfolio-tags] OK - ${checks.length} checks`)
