#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const checks = []
const failures = []
const OBJECT_LEAK_TOKEN = '[' + 'object Object' + ']'
const exists = (file) => fs.existsSync(path.join(root, file))
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
function check(name, condition) { checks.push(name); if (!condition) failures.push(name) }

const files = [
  'src/content/pages/works/editorial-showcase/index.md',
  'src/markdown/__fixtures__/portfolio-editorial-showcase.md',
  'docs/authoring/portfolio-editorial-showcase.md',
  'docs/migration/commit-125.md',
  'BAKE_REPORT_COMMIT_125.md',
  'scripts/smoke-portfolio-editorial-showcase.mjs',
]

for (const file of files) check(`${file} exists`, exists(file))

const page = read('src/content/pages/works/editorial-showcase/index.md')
const fixture = read('src/markdown/__fixtures__/portfolio-editorial-showcase.md')
const docs = read('docs/authoring/portfolio-editorial-showcase.md')
const migration = read('docs/migration/commit-125.md')
const report = read('BAKE_REPORT_COMMIT_125.md')
const pkg = JSON.parse(read('package.json'))
const launch = read('scripts/check-launch.mjs')

check('showcase page is hidden from public collection', page.includes('visibility: "hidden"') || page.includes("visibility: 'hidden'"))
check('showcase work status is private', page.includes('status: "private"') || page.includes("status: 'private'"))
check('showcase contains existing markdown heading', page.includes('# Editorial Block Showcase'))
check('showcase contains editorial-title', page.includes('::editorial-title'))
check('showcase contains editorial-columns', page.includes('::editorial-columns'))
check('showcase contains major heading preview', page.includes('level: major'))
check('showcase contains middle heading preview', page.includes('level: middle'))
check('showcase contains minor heading preview', page.includes('level: minor'))
check('showcase contains 2-column preview', page.includes('cols: 2'))
check('showcase contains 3-column preview', page.includes('cols: 3'))
check('showcase contains emotion / structure / technology pattern', page.includes('### 감정') && page.includes('### 구조') && page.includes('### 기술'))
check('showcase contains problem / solution pattern', page.includes('### 문제') && page.includes('### 해결'))
check('showcase contains long token preview', page.includes('very-long-token-that-should-wrap'))
check('fixture contains editorial-title', fixture.includes('::editorial-title'))
check('fixture contains editorial-columns', fixture.includes('::editorial-columns'))
check('fixture preserves Markdown heading behavior note', fixture.includes('existing Markdown heading behavior') || fixture.includes('Markdown heading behavior'))
check('docs explain preview surface purpose', docs.includes('preview surface'))
check('docs mention exposure policy', docs.includes('Exposure policy'))
check('docs mention no parser rewrite', docs.includes('No editorial parser rewrite'))
check('migration states no inquiry system changes', migration.includes('No inquiry system changes'))
check('migration states no new block types', migration.includes('No new editorial block types'))
check('bake report seals preview surface', report.includes('preview surface'))
check('bake report lists showcase smoke', report.includes('smoke:portfolio-editorial-showcase'))
check('package showcase smoke script exists', pkg.scripts?.['smoke:portfolio-editorial-showcase'] === 'node scripts/smoke-portfolio-editorial-showcase.mjs')
check('check-launch includes showcase smoke', launch.includes('smoke-portfolio-editorial-showcase.mjs'))

const sourceBundle = files.concat(['package.json', 'scripts/check-launch.mjs']).map(read).join('\n')
check('source contains no object leak', !sourceBundle.includes(OBJECT_LEAK_TOKEN))

if (failures.length) {
  console.error('smoke:portfolio-editorial-showcase FAILED')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`[smoke:portfolio-editorial-showcase] OK - ${checks.length} checks`)
