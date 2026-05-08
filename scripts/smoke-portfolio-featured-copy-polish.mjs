#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const checks = []
const failures = []
const OBJECT_LEAK_TOKEN = '[' + 'object Object' + ']'

const exists = (file) => fs.existsSync(path.join(root, file))
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
function check(name, condition) {
  checks.push(name)
  if (!condition) failures.push(name)
}

const files = [
  'src/content/pages/works/index.md',
  'src/content/pages/works/varuntools-showroom/index.md',
  'src/markdown/__fixtures__/portfolio-featured-copy-polish.md',
  'docs/authoring/portfolio-copy-rhythm-guide.md',
  'docs/migration/commit-126.md',
  'BAKE_REPORT_COMMIT_126.md',
  'scripts/smoke-portfolio-featured-copy-polish.mjs',
]

for (const file of files) check(`${file} exists`, exists(file))

const works = read('src/content/pages/works/index.md')
const showroom = read('src/content/pages/works/varuntools-showroom/index.md')
const fixture = read('src/markdown/__fixtures__/portfolio-featured-copy-polish.md')
const guide = read('docs/authoring/portfolio-copy-rhythm-guide.md')
const migration = read('docs/migration/commit-126.md')
const report = read('BAKE_REPORT_COMMIT_126.md')
const pkg = JSON.parse(read('package.json'))
const launch = read('scripts/check-launch.mjs')
const featured = `${works}\n${showroom}`

check('works/index.md keeps existing Markdown heading', works.includes('# Works'))
check('varuntools-showroom keeps existing Markdown heading', showroom.includes('# VARUNTOOLS Showroom System'))
check('featured content uses editorial-title', featured.includes('::editorial-title'))
check('featured content uses editorial-columns', featured.includes('::editorial-columns'))
check('featured content has major heading', featured.includes('level: major'))
check('featured content has middle heading', featured.includes('level: middle'))
check('featured content has minor heading', featured.includes('level: minor'))
check('featured content has emotion structure technology pattern', featured.includes('### 감정') && featured.includes('### 구조') && featured.includes('### 기술'))
check('featured content has problem solution pattern', featured.includes('### 문제') && featured.includes('### 해결'))
check('works index has polished featured works title', works.includes('title: 대표 작업'))
check('works index has reading standard section', works.includes('title: 작업을 읽는 기준'))
check('showroom has tightened showroom fixation section', showroom.includes('title: 쇼룸이 고정하는 것'))
check('fixture exists with major/middle/minor examples', fixture.includes('level: major') && fixture.includes('level: middle') && fixture.includes('level: minor'))
check('fixture has 2-column and 3-column examples', fixture.includes('cols: 2') && fixture.includes('cols: 3'))
check('fixture preserves Markdown heading behavior', fixture.includes('Existing Markdown heading remains'))
check('copy rhythm guide contains heading rhythm', guide.includes('Heading rhythm'))
check('copy rhythm guide contains column rhythm', guide.includes('Column rhythm'))
check('copy rhythm guide contains overuse rule', guide.includes('Overuse rule'))
check('copy rhythm guide contains emotion structure technology', guide.includes('Emotion / structure / technology'))
check('migration states no parser rewrite', migration.includes('No editorial parser rewrite'))
check('migration states no inquiry system changes', migration.includes('No inquiry system changes'))
check('bake report seals featured content polish', report.includes('featured portfolio content polish'))
check('bake report lists polished pages', report.includes('src/content/pages/works/index.md') && report.includes('src/content/pages/works/varuntools-showroom/index.md'))
check('package script exists', pkg.scripts?.['smoke:portfolio-featured-copy-polish'] === 'node scripts/smoke-portfolio-featured-copy-polish.mjs')
check('check-launch includes featured copy polish smoke', launch.includes('smoke-portfolio-featured-copy-polish.mjs'))

const sourceBundle = files.concat(['package.json', 'scripts/check-launch.mjs']).map(read).join('\n')
check('source contains no object leak', !sourceBundle.includes(OBJECT_LEAK_TOKEN))

if (failures.length) {
  console.error('smoke:portfolio-featured-copy-polish FAILED')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`[smoke:portfolio-featured-copy-polish] OK - ${checks.length} checks`)
