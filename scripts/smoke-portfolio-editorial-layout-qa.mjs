#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
const root = process.cwd()
const checks = []
const failures = []
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const exists = (file) => fs.existsSync(path.join(root, file))
function check(name, condition) { checks.push(name); if (!condition) failures.push(name) }
function includes(file, token) { return exists(file) && read(file).includes(token) }
const files = [
  'src/styles/markdown-portfolio.css',
  'src/markdown/__fixtures__/portfolio-editorial-layout-qa.md',
  'src/markdown/__fixtures__/portfolio-editorial-applied.md',
  'src/content/pages/works/index.md',
  'src/content/pages/works/varuntools-showroom/index.md',
  'docs/authoring/portfolio-editorial-layout-qa.md',
  'docs/migration/commit-123.md',
  'BAKE_REPORT_COMMIT_123.md',
]
for (const file of files) check(`${file} exists`, exists(file))
const css = read('src/styles/markdown-portfolio.css')
const fixture = read('src/markdown/__fixtures__/portfolio-editorial-layout-qa.md')
const applied = ['src/content/pages/works/index.md','src/content/pages/works/varuntools-showroom/index.md'].map(read).join('\n')
const docs = read('docs/authoring/portfolio-editorial-layout-qa.md')
const migration = read('docs/migration/commit-123.md')
const report = read('BAKE_REPORT_COMMIT_123.md')
const packageJson = JSON.parse(read('package.json'))
check('QA fixture contains editorial-title', fixture.includes('::editorial-title'))
check('QA fixture contains editorial-columns', fixture.includes('::editorial-columns'))
check('QA fixture contains major heading case', fixture.includes('level: major'))
check('QA fixture contains middle heading case', fixture.includes('level: middle'))
check('QA fixture contains minor heading case', fixture.includes('level: minor'))
check('QA fixture contains 2-column case', fixture.includes('cols: 2'))
check('QA fixture contains 3-column case', fixture.includes('cols: 3'))
check('QA fixture contains collapse mobile case', fixture.includes('collapse: mobile'))
check('QA fixture contains collapse tablet case', fixture.includes('collapse: tablet'))
check('QA fixture preserves existing markdown heading', fixture.includes('# Existing Markdown heading remains part of the authoring flow'))
check('CSS contains section block gap token', css.includes('--vt-editorial-section-block-gap'))
check('CSS applies text-wrap balance to headings', css.includes('text-wrap: balance'))
check('CSS applies text-wrap pretty to subtitles', css.includes('text-wrap: pretty'))
check('CSS contains min-width guard', css.includes('min-width: 0'))
check('CSS contains overflow-wrap guard', css.includes('overflow-wrap: anywhere'))
check('CSS contains max-width guard', css.includes('max-width: 100%'))
check('CSS contains overflow-x clip guard', css.includes('overflow-x: clip'))
check('CSS keeps tablet collapse', css.includes("[data-collapse='tablet']") && css.includes('max-width: 960px'))
check('CSS keeps mobile collapse', css.includes(".vt-editorial-columns:not([data-collapse='never'])") && css.includes('max-width: 720px'))
check('real portfolio pages still use editorial-title', applied.includes('::editorial-title'))
check('real portfolio pages still use editorial-columns', applied.includes('::editorial-columns'))
check('real portfolio pages still preserve markdown headings', applied.includes('# Works') && applied.includes('# VARUNTOOLS Showroom System'))
check('authoring doc explains responsive rules', docs.includes('Responsive rules'))
check('authoring doc explains long text rules', docs.includes('Long text rules'))
check('authoring doc explains accessibility rule', docs.includes('Accessibility rule'))
check('migration doc states no inquiry changes', migration.includes('No inquiry system changes'))
check('migration doc states no parser rewrite', migration.includes('No editorial parser rewrite'))
check('bake report seals layout hardening', report.includes('조판 안정화 커밋'))
check('package script exists', packageJson.scripts?.['smoke:portfolio-editorial-layout-qa'] === 'node scripts/smoke-portfolio-editorial-layout-qa.mjs')
check('check-launch includes layout QA smoke', includes('scripts/check-launch.mjs', 'smoke-portfolio-editorial-layout-qa.mjs'))
const sourceBundle = files.concat(['package.json','scripts/check-launch.mjs']).map(read).join('\n')
check('source contains no object leak', !sourceBundle.includes('[object Object]'))
if (failures.length) { console.error('smoke:portfolio-editorial-layout-qa FAILED'); for (const f of failures) console.error(`- ${f}`); process.exit(1) }
console.log(`[smoke:portfolio-editorial-layout-qa] OK - ${checks.length} checks`)
