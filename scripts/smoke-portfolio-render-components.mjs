#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { parseCsv, csvRowsToObjects } from './lib/csv.mjs'
import { csvRowsToMarkdown } from './lib/csv-markdown.mjs'

const root = process.cwd()
const checks = []
const failures = []
function check(name, condition) { checks.push(name); if (!condition) failures.push(name) }
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8') }
function exists(file) { return fs.existsSync(path.join(root, file)) }

const componentFiles = [
  'src/components/portfolio/PortfolioHero.vue',
  'src/components/portfolio/WorkSummary.vue',
  'src/components/portfolio/RoleStack.vue',
  'src/components/portfolio/CaseSection.vue',
  'src/components/portfolio/MetricCard.vue',
  'src/components/portfolio/ToolStack.vue',
  'src/components/portfolio/QuoteBlock.vue',
  'src/components/portfolio/CaseGallery.vue',
  'src/components/portfolio/CaseGalleryItem.vue',
  'src/components/portfolio/PortfolioRelatedWorks.vue',
]
for (const file of componentFiles) check(`${file} exists`, exists(file))

const directiveTypes = read('src/markdown/directiveTypes.ts')
const directiveIndex = read('src/markdown/directives/index.ts')
const plugin = read('src/markdown/directivePlugin.ts')
const mount = read('src/markdown/mountMarkdownComponents.ts')
const css = read('src/styles/markdown-portfolio.css')
const main = read('src/main.ts')
const csvMarkdown = read('scripts/lib/csv-markdown.mjs')

for (const directive of ['portfolio-hero', 'work-summary', 'role-stack', 'case-section', 'metric-card', 'tool-stack', 'quote-block', 'case-gallery', 'case-gallery-item', 'related-works']) {
  check(`directiveTypes registers ${directive}`, directiveTypes.includes(`'${directive}'`))
  check(`directivePlugin treats ${directive} as known/body-capable when needed`, directive === 'case-gallery-item' ? directiveTypes.includes(`'${directive}'`) : plugin.includes(`'${directive}'`))
  check(`mountMarkdownComponents mounts ${directive}`, mount.includes(`querySelectorAll('${directive}')`))
}

check('directive index imports portfolioDirective', directiveIndex.includes("from './portfolioDirective'"))
check('PortfolioHero component mounted', mount.includes('PortfolioHero'))
check('CaseSection component mounted', mount.includes('CaseSection'))
check('MetricCard component mounted', mount.includes('MetricCard'))
check('CaseGallery component mounted', mount.includes('CaseGallery'))
check('main imports markdown-portfolio.css', main.includes("./styles/markdown-portfolio.css"))
check('CSS keeps vt portfolio tone classes', css.includes('.vt-portfolio-hero') && css.includes('var(--vt-surface-strong)') && css.includes('.vt-case-section'))
check('csv-markdown emits portfolio-hero directive', csvMarkdown.includes("renderPortfolioDirective('portfolio-hero'"))
check('csv-markdown emits case-section directive', csvMarkdown.includes("renderPortfolioDirective('case-section'"))
check('csv-markdown emits metric-card directive', csvMarkdown.includes("renderPortfolioDirective('metric-card'"))
check('csv-markdown emits case-gallery directive', csvMarkdown.includes("'::case-gallery'"))
check('portfolio case blocks no longer default to markdown-box', !/function renderCaseSection[\s\S]*renderMarkdownBoxBlock/.test(csvMarkdown))

const fixture = path.join(root, 'src/content/templates/csv-fixtures/case-study-basic/page.csv')
const rows = csvRowsToObjects(parseCsv(fs.readFileSync(fixture, 'utf8')), { sourcePath: 'src/content/templates/csv-fixtures/case-study-basic/page.csv' })
const result = csvRowsToMarkdown(rows, { sourceCsvPath: 'src/content/templates/csv-fixtures/case-study-basic/page.csv', projectRoot: root, strict: true })
const markdown = result.markdown
check('fixture markdown contains portfolio hero directive', markdown.includes('::portfolio-hero'))
check('fixture markdown contains case section directive', markdown.includes('::case-section') && markdown.includes('type: decision'))
check('fixture markdown contains metric card directive', markdown.includes('::metric-card'))
check('fixture markdown contains tool stack directive', markdown.includes('::tool-stack'))
check('fixture markdown contains case gallery directive', markdown.includes('::case-gallery'))
check('fixture markdown contains related works directive', markdown.includes('::related-works'))
check('generated markdown avoids object leakage', !markdown.includes('[object Object]'))
check('fixture markdown no longer uses markdown-box for case sections', !markdown.includes('::markdown-box') || !markdown.includes('type: decision'))

const packageJson = JSON.parse(read('package.json'))
check('package script exists', packageJson.scripts?.['smoke:portfolio-render-components'] === 'node scripts/smoke-portfolio-render-components.mjs')
check('check-launch includes portfolio render smoke', read('scripts/check-launch.mjs').includes('smoke-portfolio-render-components.mjs'))

if (failures.length) {
  console.error('smoke:portfolio-render-components FAILED')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`[smoke:portfolio-render-components] OK - ${checks.length} checks`)
