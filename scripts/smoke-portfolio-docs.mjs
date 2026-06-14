#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const failures = []
const checks = []

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

function exists(file) {
  return fs.existsSync(path.join(root, file))
}

function check(name, condition) {
  checks.push(name)
  if (!condition) failures.push(name)
}

const guidePath = 'docs/authoring/portfolio-authoring-v2.md'
check('portfolio-authoring-v2.md exists', exists(guidePath))
const guide = exists(guidePath) ? read(guidePath) : ''

check('guide states page.csv SSOT', guide.includes('page.csv is the authoring SSOT') || guide.includes('page.csv가 작성 SSOT'))
check('guide states index.md generated output', guide.includes('index.md is generated output') || guide.includes('index.md는 생성'))
check('guide includes new-page preset command', guide.includes('npm run new:page -- works my-case --csv --type case-study'))
check('guide includes frontmatter.work', guide.includes('frontmatter.work'))
check('guide includes portfolio block list', guide.includes('portfolio-hero') && guide.includes('case-gallery-start') && guide.includes('related-works'))
check('guide includes options v2 examples', guide.includes('stack=[Vue, TypeScript') && guide.includes('mood.tone=almond-paper'))
check('guide includes asset guard rules', guide.includes('Asset guard') || guide.includes('asset guard'))
check('guide includes related-works rules', guide.includes('related-works rules') || guide.includes('related-works'))
check('guide includes home featured rules', guide.includes('Home featured') || guide.includes('home featured'))
check('guide includes preview command', guide.includes('--preview'))
check('guide includes diff command', guide.includes('--diff'))
check('guide includes check command', guide.includes('--check'))
check('guide includes report command', guide.includes('--report'))
check('guide includes publish checklist', guide.includes('Publish checklist') || guide.includes('발행 전 체크리스트'))
check('guide includes common failures', guide.includes('Common failures') || guide.includes('자주 터지는 오류'))
check('guide has no object leakage', !guide.includes('[object Object]'))

const relatedDocs = [
  'docs/authoring/portfolio-presets.md',
  'docs/authoring/portfolio-frontmatter.md',
  'docs/authoring/portfolio-render-components.md',
  'docs/authoring/portfolio-links.md',
  'docs/authoring/csv-asset-guard.md',
]
for (const file of relatedDocs) {
  check(`${file} exists`, exists(file))
}

const pkg = JSON.parse(read('package.json'))
check('package exposes smoke:portfolio-docs', pkg.scripts?.['smoke:portfolio-docs'] === 'node scripts/smoke-portfolio-docs.mjs')
check('check-launch includes docs smoke', read('scripts/check-launch.mjs').includes('smoke-portfolio-docs.mjs'))

if (failures.length) {
  console.error('smoke:portfolio-docs FAILED')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`[smoke:portfolio-docs] OK - ${checks.length} checks`)
