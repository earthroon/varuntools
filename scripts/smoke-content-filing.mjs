#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const checks = []
const failures = []
function check(name, condition) { checks.push(name); if (!condition) failures.push(name) }
function exists(p) { return fs.existsSync(path.join(root, p)) }
function read(p) { return fs.readFileSync(path.join(root, p), 'utf8') }

for (const file of [
  'scripts/new-page.mjs', 'scripts/check-launch.mjs',
  'src/content/templates/work.md', 'src/content/templates/lab.md', 'src/content/templates/tool.md',
  'docs/authoring/content-structure.md', 'docs/authoring/page-frontmatter.md', 'docs/authoring/markdown-components.md',
  'docs/authoring/gallery-authoring.md', 'docs/authoring/media-authoring.md', 'docs/authoring/launch-checklist.md',
]) check(`${file} exists`, exists(file))

const pkg = JSON.parse(read('package.json'))
check('package.json has new:page', pkg.scripts?.['new:page'] === 'node scripts/new-page.mjs')
check('package.json has audit:content', Boolean(pkg.scripts?.['audit:content']))
check('package.json has check:launch', pkg.scripts?.['check:launch'] === 'node scripts/check-launch.mjs')
check('package.json has smoke:content-filing', pkg.scripts?.['smoke:content-filing'] === 'node scripts/smoke-content-filing.mjs')
check('Visual QA contains Content Filing Contract', read('src/content/pages/lab-markdown-gallery/index.md').includes('Content Filing Contract'))
check('README contains new:page', read('README.md').includes('npm run new:page'))
check('README contains audit:content', read('README.md').includes('npm run audit:content'))
check('README contains check:launch', read('README.md').includes('npm run check:launch'))

fs.rmSync(path.join(root, 'tmp'), { recursive: true, force: true })
const create = spawnSync('node', ['scripts/new-page.mjs', 'works', 'smoke-project', '--root', 'tmp/content-filing-smoke'], { cwd: root, encoding: 'utf8' })
check('new-page smoke command succeeds', create.status === 0)
check('new-page creates index.md', exists('tmp/content-filing-smoke/works/smoke-project/index.md'))
check('new-page creates images/.gitkeep', exists('tmp/content-filing-smoke/works/smoke-project/images/.gitkeep'))
check('new-page creates videos/.gitkeep', exists('tmp/content-filing-smoke/works/smoke-project/videos/.gitkeep'))
check('new-page creates README.md', exists('tmp/content-filing-smoke/works/smoke-project/README.md'))
const duplicate = spawnSync('node', ['scripts/new-page.mjs', 'works', 'smoke-project', '--root', 'tmp/content-filing-smoke'], { cwd: root, encoding: 'utf8' })
check('new-page refuses existing folder', duplicate.status !== 0 && duplicate.stderr.includes('already exists'))
const badCategory = spawnSync('node', ['scripts/new-page.mjs', 'bad', 'smoke-project', '--root', 'tmp/content-filing-smoke'], { cwd: root, encoding: 'utf8' })
check('new-page refuses invalid category', badCategory.status !== 0 && badCategory.stderr.includes('category must be one of'))
const badSlug = spawnSync('node', ['scripts/new-page.mjs', 'works', 'Bad Slug', '--root', 'tmp/content-filing-smoke'], { cwd: root, encoding: 'utf8' })
check('new-page refuses invalid slug', badSlug.status !== 0 && badSlug.stderr.includes('slug must be lowercase'))
fs.rmSync(path.join(root, 'tmp'), { recursive: true, force: true })
if (failures.length) { console.error('smoke:content-filing FAILED'); failures.forEach(f => console.error(`- ${f}`)); process.exit(1) }
console.log(`smoke:content-filing OK — ${checks.length} checks`)
