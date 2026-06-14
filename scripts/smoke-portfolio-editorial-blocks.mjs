#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
const root = process.cwd()
const failures = []
const checks = []
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const exists = (file) => fs.existsSync(path.join(root, file))
function check(name, condition) { checks.push(name); if (!condition) failures.push(name) }
function includes(file, token) { return exists(file) && read(file).includes(token) }
const files = [
  'src/components/portfolio/EditorialTitle.vue',
  'src/components/portfolio/EditorialColumns.vue',
  'src/components/portfolio/EditorialColumn.vue',
  'src/types/editorialBlocks.ts',
  'src/markdown/directives/portfolioDirective.ts',
  'src/markdown/directives/index.ts',
  'src/markdown/directiveTypes.ts',
  'src/markdown/directivePlugin.ts',
  'src/markdown/mountMarkdownComponents.ts',
  'src/styles/markdown-portfolio.css',
  'src/markdown/__fixtures__/portfolio-editorial-blocks.md',
  'docs/authoring/portfolio-editorial-blocks.md',
  'docs/migration/commit-121.md',
  'BAKE_REPORT_COMMIT_121.md',
]
for (const file of files) check(`${file} exists`, exists(file))
check('EditorialHeadingLevel type exists', includes('src/types/editorialBlocks.ts', 'EditorialHeadingLevel'))
check('EditorialHeadingBlockProps type exists', includes('src/types/editorialBlocks.ts', 'EditorialHeadingBlockProps'))
check('EditorialColumnCount type exists', includes('src/types/editorialBlocks.ts', 'EditorialColumnCount'))
check('EditorialColumnsProps type exists', includes('src/types/editorialBlocks.ts', 'EditorialColumnsProps'))
check('directiveTypes registers editorial-title', includes('src/markdown/directiveTypes.ts', "'editorial-title'"))
check('directiveTypes registers editorial-columns', includes('src/markdown/directiveTypes.ts', "'editorial-columns'"))
check('directivePlugin treats editorial-columns as body directive', includes('src/markdown/directivePlugin.ts', "'editorial-columns'"))
check('directive index routes editorial-title', includes('src/markdown/directives/index.ts', "case 'editorial-title'"))
check('directive index routes editorial-columns', includes('src/markdown/directives/index.ts', "case 'editorial-columns'"))
check('portfolioDirective renders editorial title', includes('src/markdown/directives/portfolioDirective.ts', 'renderEditorialTitleDirective'))
check('portfolioDirective renders editorial columns', includes('src/markdown/directives/portfolioDirective.ts', 'renderEditorialColumnsDirective'))
check('portfolioDirective splits columns on --- separator', includes('src/markdown/directives/portfolioDirective.ts', 'split(/^---\\s*$/m)'))
check('mount imports EditorialTitle', includes('src/markdown/mountMarkdownComponents.ts', 'EditorialTitle'))
check('mount imports EditorialColumns', includes('src/markdown/mountMarkdownComponents.ts', 'EditorialColumns'))
check('mount handles editorial-title tag', includes('src/markdown/mountMarkdownComponents.ts', "querySelectorAll('editorial-title')"))
check('mount handles editorial-columns tag', includes('src/markdown/mountMarkdownComponents.ts', "querySelectorAll('editorial-columns')"))
check('CSS defines editorial title block', includes('src/styles/markdown-portfolio.css', '.vt-editorial-title'))
check('CSS defines major heading hierarchy', includes('src/styles/markdown-portfolio.css', "[data-level='major']"))
check('CSS defines middle heading hierarchy', includes('src/styles/markdown-portfolio.css', "[data-level='middle']"))
check('CSS defines minor heading hierarchy', includes('src/styles/markdown-portfolio.css', "[data-level='minor']"))
check('CSS defines editorial columns grid', includes('src/styles/markdown-portfolio.css', '.vt-editorial-columns'))
check('CSS defines 2-column contract', includes('src/styles/markdown-portfolio.css', "[data-cols='2']"))
check('CSS defines 3-column contract', includes('src/styles/markdown-portfolio.css', "[data-cols='3']"))
check('CSS defines responsive mobile collapse', includes('src/styles/markdown-portfolio.css', 'max-width: 720px') && includes('src/styles/markdown-portfolio.css', 'grid-template-columns: 1fr'))
const fixture = read('src/markdown/__fixtures__/portfolio-editorial-blocks.md')
check('fixture preserves existing markdown heading', fixture.includes('# Existing Markdown heading remains valid'))
check('fixture contains editorial-title directive', fixture.includes('::editorial-title'))
check('fixture contains major heading', fixture.includes('level: major'))
check('fixture contains middle heading', fixture.includes('level: middle'))
check('fixture contains minor heading', fixture.includes('level: minor'))
check('fixture contains editorial-columns directive', fixture.includes('::editorial-columns'))
check('fixture contains 2-column example', fixture.includes('cols: 2'))
check('fixture contains 3-column example', fixture.includes('cols: 3'))
check('authoring doc explains existing headings remain valid', includes('docs/authoring/portfolio-editorial-blocks.md', 'Existing Markdown headings remain valid'))
check('authoring doc includes editorial-title', includes('docs/authoring/portfolio-editorial-blocks.md', 'editorial-title'))
check('authoring doc includes editorial-columns', includes('docs/authoring/portfolio-editorial-blocks.md', 'editorial-columns'))
check('authoring doc includes accessibility rule', includes('docs/authoring/portfolio-editorial-blocks.md', 'Accessibility rule'))
check('migration doc states inquiry unchanged', includes('docs/migration/commit-121.md', 'Commit 121 does not change inquiry behavior'))
check('bake report seals portfolio expression system', includes('BAKE_REPORT_COMMIT_121.md', '포트폴리오 표현 시스템'))
const packageJson = JSON.parse(read('package.json'))
check('package script exists', packageJson.scripts?.['smoke:portfolio-editorial-blocks'] === 'node scripts/smoke-portfolio-editorial-blocks.mjs')
check('check-launch includes portfolio editorial smoke', includes('scripts/check-launch.mjs', 'smoke-portfolio-editorial-blocks.mjs'))
const allSource = files.map((file) => read(file)).join('\n')
check('source contains no [object Object]', !allSource.includes('[object Object]'))
if (failures.length) { console.error('smoke:portfolio-editorial-blocks FAILED'); for (const f of failures) console.error(`- ${f}`); process.exit(1) }
console.log(`[smoke:portfolio-editorial-blocks] OK - ${checks.length} checks`)
