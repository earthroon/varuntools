#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { parseCsv, csvRowsToObjects } from './lib/csv.mjs'
import { csvRowsToMarkdown } from './lib/csv-markdown.mjs'

const root = process.cwd()
const checks = []
const failures = []
function check(name, condition) { checks.push(name); if (!condition) failures.push(name) }
function exists(p) { return fs.existsSync(path.join(root, p)) }
function read(p) { return fs.readFileSync(path.join(root, p), 'utf8') }

for (const file of [
  'scripts/lib/csv.mjs',
  'scripts/lib/csv-markdown.mjs',
  'scripts/csv-to-markdown.mjs',
  'scripts/csv-pages.mjs',
  'src/content/templates/work.csv',
  'src/content/templates/lab.csv',
  'src/content/templates/tool.csv',
  'docs/authoring/csv-authoring.md',
]) check(`${file} exists`, exists(file))

const pkg = JSON.parse(read('package.json'))
check('package.json has csv:page', pkg.scripts?.['csv:page'] === 'node scripts/csv-to-markdown.mjs')
check('package.json has csv:pages', pkg.scripts?.['csv:pages'] === 'node scripts/csv-pages.mjs')
check('package.json has smoke:csv-authoring', pkg.scripts?.['smoke:csv-authoring'] === 'node scripts/smoke-csv-authoring.mjs')
check('new-page supports --csv', read('scripts/new-page.mjs').includes('--csv') && read('scripts/new-page.mjs').includes('csvRowsToMarkdown'))

const parsed = parseCsv('\uFEFFblock,title,body\nparagraph,,"쉼표가 있는 문장, 이렇게"\nparagraph,,"줄1\n줄2"\n')
check('csv parser handles BOM', parsed[0][0] === 'block')
check('csv parser handles quoted comma', parsed[1][2] === '쉼표가 있는 문장, 이렇게')
check('csv parser handles quoted newline', parsed[2][2] === '줄1\n줄2')
check('csvRowsToObjects maps header', csvRowsToObjects(parsed)[0].block === 'paragraph')

const generatorSource = read('scripts/lib/csv-markdown.mjs')
for (const token of ['case \'heading\'', 'case \'image\'', 'case \'before-after\'', 'case \'video\'', 'gallery-start', 'gallery-item', 'GENERATED FROM']) {
  check(`csv markdown generator supports ${token}`, generatorSource.includes(token))
}

check('Visual QA contains CSV Authoring Contract', read('src/content/pages/lab-markdown-gallery/index.md').includes('CSV Authoring Contract'))
check('README contains csv:page', read('README.md').includes('npm run csv:page'))
check('README contains new:page --csv', read('README.md').includes('new:page -- works project-name --csv'))
check('check:launch includes smoke:csv-authoring', read('scripts/check-launch.mjs').includes('smoke:csv-authoring'))

const tmpDir = path.join(root, 'tmp', 'csv-authoring-smoke')
fs.rmSync(tmpDir, { recursive: true, force: true })
fs.mkdirSync(path.join(tmpDir, 'images'), { recursive: true })
fs.writeFileSync(path.join(tmpDir, 'images', 'cover.webp'), 'fake-webp')
const sampleCsv = `block,title,body,src,alt,caption,thumb,layout,kind,options,meta
page,Smoke Page,Smoke description.,./images/cover.webp,,,./images/cover.webp,,,tags=smoke|csv; order=99; gallery.autoMini=true,
heading,Smoke Page,,,,,,,h1,,
box,Smoke Box,Box body.,,,,,,ssot,,
image,,,./images/cover.webp,Cover,[필수] Cover caption,,,,,
gallery-start,Smoke Gallery,Gallery caption.,,,,,strip,,lightbox=true,
gallery-item,,,./images/cover.webp,,Gallery A,./images/cover.webp,,,,title=Gallery A; tag=smoke
gallery-end,,,,,,,,,,
`
fs.writeFileSync(path.join(tmpDir, 'page.csv'), sampleCsv, 'utf8')
const convert = spawnSync('node', ['scripts/csv-to-markdown.mjs', path.relative(root, path.join(tmpDir, 'page.csv'))], { cwd: root, encoding: 'utf8' })
check('csv:page smoke command succeeds', convert.status === 0)
const generatedPath = path.join(tmpDir, 'index.md')
check('csv:page writes index.md', fs.existsSync(generatedPath))
const generated = fs.existsSync(generatedPath) ? fs.readFileSync(generatedPath, 'utf8') : ''
for (const token of ['GENERATED FROM', 'title: "Smoke Page"', '::markdown-box', '![Cover]', '::gallery-strip']) {
  check(`generated markdown contains ${token}`, generated.includes(token))
}
const dryRun = spawnSync('node', ['scripts/csv-to-markdown.mjs', path.relative(root, path.join(tmpDir, 'page.csv')), '--dry-run'], { cwd: root, encoding: 'utf8' })
check('csv:page dry-run succeeds', dryRun.status === 0 && dryRun.stdout.includes('GENERATED FROM'))
const newPage = spawnSync('node', ['scripts/new-page.mjs', 'works', 'csv-smoke-project', '--csv', '--root', 'tmp/csv-new-page-smoke'], { cwd: root, encoding: 'utf8' })
check('new-page --csv succeeds', newPage.status === 0)
check('new-page --csv creates page.csv', exists('tmp/csv-new-page-smoke/works/csv-smoke-project/page.csv'))
check('new-page --csv creates generated index.md', exists('tmp/csv-new-page-smoke/works/csv-smoke-project/index.md') && read('tmp/csv-new-page-smoke/works/csv-smoke-project/index.md').includes('GENERATED FROM'))
fs.rmSync(path.join(root, 'tmp'), { recursive: true, force: true })

if (failures.length) {
  console.error('smoke:csv-authoring FAILED')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log(`smoke:csv-authoring OK — ${checks.length} checks`)
