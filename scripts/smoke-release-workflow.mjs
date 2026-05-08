#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const exists = (file) => fs.existsSync(path.join(root, file))
const pkg = JSON.parse(read('package.json'))
const deploy = read('scripts/deploy-pages-branch.mjs')
const prepare = read('scripts/release-prepare.mjs')
const gitStatus = read('scripts/git-status.mjs')
const docs = read('docs/deploy/github-pages.md')
const readme = read('README.md')
const gitignore = read('.gitignore')
const attributes = read('.gitattributes')
const checkLaunch = read('scripts/check-launch.mjs')

const checks = [
  ['git-status script exists', exists('scripts/git-status.mjs')],
  ['release-prepare script exists', exists('scripts/release-prepare.mjs')],
  ['deploy-pages script exists', exists('scripts/deploy-pages-branch.mjs')],
  ['package git:status', pkg.scripts?.['git:status'] === 'node scripts/git-status.mjs'],
  ['package release:prepare', pkg.scripts?.['release:prepare'] === 'node scripts/release-prepare.mjs'],
  ['package release:pages', pkg.scripts?.['release:pages'] === 'node scripts/deploy-pages-branch.mjs'],
  ['package deploy:pages alias', pkg.scripts?.['deploy:pages'] === 'npm run release:pages'],
  ['package smoke:release-workflow', pkg.scripts?.['smoke:release-workflow'] === 'node scripts/smoke-release-workflow.mjs'],
  ['deploy source branch main', deploy.includes("const SOURCE_BRANCH = 'main'")],
  ['deploy branch gh-pages', deploy.includes("const DEPLOY_BRANCH = 'gh-pages'")],
  ['deploy custom domain varun.tools', deploy.includes("const CUSTOM_DOMAIN = 'varun.tools'")],
  ['deploy pages folder root', deploy.includes("const PAGES_FOLDER = '/'")],
  ['deploy copies dist contents', deploy.includes('copyDirContents(distDir, worktreeRoot)')],
  ['deploy writes .nojekyll', deploy.includes("'.nojekyll'")],
  ['deploy always writes CNAME', deploy.includes("'CNAME'") && deploy.includes('CUSTOM_DOMAIN')],
  ['deploy supports --push', deploy.includes("args.has('--push')")],
  ['deploy supports --dry-run', deploy.includes("args.has('--dry-run')")],
  ['deploy uses worktree', deploy.includes('git') && deploy.includes('worktree')],
  ['release prepare runs csv pages', prepare.includes("'csv:pages'")],
  ['release prepare runs check launch', prepare.includes("'check:launch'")],
  ['release prepare runs build', prepare.includes("'build'")],
  ['git status prints branch', gitStatus.includes('[git] branch:')],
  ['.gitignore ignores dist', /^dist\/\s*$/m.test(gitignore)],
  ['.gitignore ignores node_modules', /^node_modules\/\s*$/m.test(gitignore)],
  ['.gitattributes exists', exists('.gitattributes')],
  ['.gitattributes markdown LF', attributes.includes('*.md text eol=lf')],
  ['.gitattributes csv LF', attributes.includes('*.csv text eol=lf')],
  ['.gitattributes image binary', attributes.includes('*.webp binary')],
  ['deploy docs exist', exists('docs/deploy/github-pages.md')],
  ['deploy docs mention main', docs.includes('Default branch: `main`')],
  ['deploy docs mention gh-pages root', docs.includes('Pages branch: `gh-pages`') && docs.includes('Pages folder: `/ root`')],
  ['deploy docs mention varun.tools', docs.includes('varun.tools')],
  ['old Actions deploy workflow removed', !exists('.github/workflows/deploy.yml')],
  ['README documents release pages', readme.includes('npm run release:pages')],
  ['check launch includes release smoke', checkLaunch.includes('smoke-release-workflow.mjs')],
]

const failed = checks.filter(([, ok]) => !ok)
if (failed.length) {
  for (const [name] of failed) console.error(`[release-workflow] missing: ${name}`)
  process.exit(1)
}

console.log(`[release-workflow] OK — ${checks.length} checks`)
