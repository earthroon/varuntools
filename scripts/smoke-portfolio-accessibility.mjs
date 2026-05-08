#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const checks = []
const failures = []

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

function check(name, condition) {
  checks.push(name)
  if (!condition) failures.push(name)
}

const hero = read('src/components/portfolio/PortfolioHero.vue')
const gallery = read('src/components/portfolio/CaseGallery.vue')
const galleryItem = read('src/components/portfolio/CaseGalleryItem.vue')
const metric = read('src/components/portfolio/MetricCard.vue')
const section = read('src/components/portfolio/CaseSection.vue')
const related = read('src/components/portfolio/PortfolioRelatedWorks.vue')
const home = read('src/components/home/HomeFeaturedWorks.vue')
const css = read('src/styles/markdown-portfolio.css')
const worksCss = read('src/styles/markdown-works.css')
const packageJson = JSON.parse(read('package.json'))
const checkLaunch = read('scripts/check-launch.mjs')

check('PortfolioHero has computed image alt fallback', hero.includes('heroImageAlt') && hero.includes("'Portfolio cover image'"))
check('CaseGallery button has aria-label', gallery.includes(':aria-label="itemLabel(item, index)"'))
check('CaseGallery caption can be described by aria-describedby', gallery.includes(':aria-describedby="item.caption ? captionId(index) : undefined"'))
check('CaseGallery missing media announces politely', gallery.includes('aria-live="polite"') && gallery.includes('Missing media'))
check('CaseGallery item fallback alt exists', gallery.includes("'Case gallery image'"))
check('CaseGalleryItem fallback alt exists', galleryItem.includes('imageAlt()') && galleryItem.includes("'Case gallery image'"))
check('MetricCard does not introduce animated counters', !metric.includes('requestAnimationFrame') && !metric.includes('setInterval') && !metric.includes('countUp'))
check('MetricCard value has aria-label', metric.includes(':aria-label='))
check('CaseSection keeps type data attribute', section.includes(':data-type="type"'))
check('PortfolioRelatedWorks does not render fallback missing strings', !related.includes('vt-related-works__fallback'))
check('HomeFeaturedWorks still filters featured entries', home.includes('.filter((entry) => entry.featured)'))
check('HomeFeaturedWorks still requires work metadata', home.includes('.filter((entry) => entry.hasWorkMetadata)'))
check('HomeFeaturedWorks still hides private and draft', home.includes("entry.workStatus !== 'private'") && home.includes("entry.workStatus !== 'draft'"))
check('portfolio css uses existing VT tokens', css.includes('var(--vt-'))
check('portfolio css includes focus-visible contract', css.includes(':focus-visible'))
check('portfolio css includes disabled gallery style', css.includes('.vt-case-gallery__item:disabled'))
check('portfolio css includes mobile breakpoint', css.includes('@media (max-width: 620px)'))
check('home css includes small mobile link polish', worksCss.includes('@media (max-width: 480px)') && worksCss.includes('justify-content: center'))
check('source contains no object leakage', ![hero, gallery, galleryItem, metric, section, related, home, css, worksCss].join('\n').includes('[object Object]'))
check('package script exists', packageJson.scripts?.['smoke:portfolio-accessibility'] === 'node scripts/smoke-portfolio-accessibility.mjs')
check('check-launch includes portfolio accessibility smoke', checkLaunch.includes('smoke-portfolio-accessibility.mjs'))

if (failures.length) {
  console.error('smoke:portfolio-accessibility FAILED')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`[smoke:portfolio-accessibility] OK - ${checks.length} checks`)
