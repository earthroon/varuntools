import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  CMS_MARKDOWN_TEXT_DRAFT_PLACEHOLDERS,
  CMS_MARKDOWN_TEXT_PLACEHOLDER_GUARD_ARTIFACT,
  scanMarkdownTextDraftPlaceholdersInContent,
} from './cmsMarkdownTextPlaceholderGuard.mjs'

const repoRoot = process.cwd()
const guardPath = path.join(repoRoot, 'scripts/cmsMarkdownTextPlaceholderGuard.mjs')
const packagePath = path.join(repoRoot, 'package.json')
const tmpRoot = path.join(repoRoot, '.tmp/vt-cms-12-placeholder-guard')
const rendererGuardFiles = [
  'src/markdown/directiveTypes.ts',
  'src/markdown/directivePlugin.ts',
  'src/markdown/directives/index.ts',
  'scripts/render-static-article-html.mjs',
]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8')
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function writeFixture(root, rel, body) {
  const target = path.join(root, rel)
  ensureDir(path.dirname(target))
  fs.writeFileSync(target, body)
  return target
}

function cleanTmp() {
  fs.rmSync(tmpRoot, { recursive: true, force: true })
  ensureDir(tmpRoot)
}

function issueHasShape(issue) {
  return Boolean(
    issue &&
    typeof issue.file === 'string' && issue.file.endsWith('.md') &&
    typeof issue.placeholder === 'string' &&
    Number.isInteger(issue.line) && issue.line >= 1 &&
    Number.isInteger(issue.column) && issue.column >= 1 &&
    typeof issue.excerpt === 'string' && issue.excerpt.includes(issue.placeholder),
  )
}

function assertRendererFilesUntouchedByGuard() {
  for (const file of rendererGuardFiles) {
    const source = read(file)
    assert(!source.includes('CMS_MARKDOWN_TEXT_DRAFT_PLACEHOLDERS'), `${file} must not import placeholder guard`)
    assert(!source.includes('scanMarkdownTextDraftPlaceholdersInContent'), `${file} must not scan placeholder guard`)
    assert(!source.includes('markdown-text-placeholder-public-guard'), `${file} must not own placeholder artifact`)
  }
}

assert(fs.existsSync(guardPath), 'guard module must exist')
assert(CMS_MARKDOWN_TEXT_DRAFT_PLACEHOLDERS.includes('[새 제목을 입력하세요]'), 'h1 placeholder missing')
assert(CMS_MARKDOWN_TEXT_DRAFT_PLACEHOLDERS.includes('[새 소제목을 입력하세요]'), 'h2 placeholder missing')
assert(CMS_MARKDOWN_TEXT_DRAFT_PLACEHOLDERS.includes('[본문을 입력하세요]'), 'body placeholder missing')
assert(CMS_MARKDOWN_TEXT_PLACEHOLDER_GUARD_ARTIFACT === 'artifacts/cms/markdown-text-placeholder-public-guard.vt-cms-12.json', 'artifact path mismatch')

cleanTmp()
const cleanRoot = path.join(tmpRoot, 'clean')
writeFixture(cleanRoot, 'src/content/pages/clean.md', [
  '---',
  'title: Clean CMS Markdown Text Block Fixture',
  '---',
  '',
  '# 정상 제목',
  '',
  '정상 본문입니다.',
  '',
  '## 정상 소제목',
  '',
].join('\n'))

const cleanBefore = fs.readFileSync(path.join(cleanRoot, 'src/content/pages/clean.md'), 'utf8')
const cleanReport = scanMarkdownTextDraftPlaceholdersInContent({ rootDir: cleanRoot, writeArtifact: true })
const cleanAfter = fs.readFileSync(path.join(cleanRoot, 'src/content/pages/clean.md'), 'utf8')
assert(cleanReport.ok, 'clean fixture must pass')
assert(cleanReport.scannedFileCount === 1, 'clean fixture must scan one file')
assert(cleanReport.issueCount === 0, 'clean fixture must have no issues')
assert(cleanBefore === cleanAfter, 'guard must not mutate clean fixture')
assert(fs.existsSync(path.join(cleanRoot, CMS_MARKDOWN_TEXT_PLACEHOLDER_GUARD_ARTIFACT)), 'clean artifact must be written')

const leakRoot = path.join(tmpRoot, 'leak')
writeFixture(leakRoot, 'src/content/pages/leak.md', [
  '---',
  'title: Leaking CMS Markdown Text Block Fixture',
  '---',
  '',
  '# [새 제목을 입력하세요]',
  '',
  '[본문을 입력하세요]',
  '',
  '## [새 소제목을 입력하세요]',
  '',
].join('\n'))

const leakPath = path.join(leakRoot, 'src/content/pages/leak.md')
const leakBefore = fs.readFileSync(leakPath, 'utf8')
const leakReport = scanMarkdownTextDraftPlaceholdersInContent({ rootDir: leakRoot, writeArtifact: true })
const leakAfter = fs.readFileSync(leakPath, 'utf8')
assert(!leakReport.ok, 'leak fixture must fail')
assert(leakReport.issueCount === 3, `leak fixture must report 3 issues, got ${leakReport.issueCount}`)
assert(leakReport.issues.every(issueHasShape), 'each leak issue must include file, line, column and excerpt')
assert(leakBefore === leakAfter, 'guard must not mutate leak fixture')
assert(fs.existsSync(path.join(leakRoot, CMS_MARKDOWN_TEXT_PLACEHOLDER_GUARD_ARTIFACT)), 'leak artifact must be written')

const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
assert(
  packageJson.scripts?.['smoke:cms-markdown-text-placeholder-public-guard'] === 'node scripts/smoke-cms-markdown-text-placeholder-public-guard.mjs',
  'package.json smoke script missing',
)

assertRendererFilesUntouchedByGuard()

const repoReport = scanMarkdownTextDraftPlaceholdersInContent({ rootDir: repoRoot, writeArtifact: true })
assert(fs.existsSync(path.join(repoRoot, CMS_MARKDOWN_TEXT_PLACEHOLDER_GUARD_ARTIFACT)), 'repo artifact must be written')
if (!repoReport.ok) {
  const detail = repoReport.issues.map((issue) => `${issue.file}:${issue.line}:${issue.column} ${issue.placeholder}`).join('\n')
  throw new Error('current src/content/pages has CMS markdown text draft placeholder leaks\n' + detail)
}

console.log('PASS_VARUNTOOLS_CMS_MARKDOWN_TEXT_PLACEHOLDER_PUBLIC_GUARD')
