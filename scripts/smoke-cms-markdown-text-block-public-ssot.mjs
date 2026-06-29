#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderStaticArticleHtml } from './render-static-article-html.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const fixturePath = path.join(repoRoot, 'scripts', 'fixtures', 'cms-markdown-text-block-page.md')
const docPath = path.join(repoRoot, 'docs', 'CMS_MARKDOWN_TEXT_BLOCK_PUBLIC_SSOT.md')
const packagePath = path.join(repoRoot, 'package.json')
const artifactDir = path.join(repoRoot, 'artifacts', 'cms')
const artifactPath = path.join(artifactDir, 'cms-markdown-text-block-public-ssot.vt-cms-11.json')

const PLACEHOLDER_SENTINELS = [
  '[새 제목을 입력하세요]',
  '[새 소제목을 입력하세요]',
  '[본문을 입력하세요]',
]

const FORBIDDEN_PUBLIC_TEXT_BLOCK_MODEL_TOKENS = [
  'markdown-text-block',
  'cms-markdown-text-block',
  'MarkdownTextBlock',
  'TextBlockRenderer',
  'textBlockDirective',
]

function readText(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : ''
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function includesAll(text, entries) {
  return entries.every((entry) => text.includes(entry))
}

function inspectPublicRendererFiles() {
  const paths = [
    'src/markdown/directiveTypes.ts',
    'src/markdown/directivePlugin.ts',
    'src/markdown/directives/index.ts',
    'src/markdown/mountMarkdownComponents.ts',
  ]
  return paths.map((relativePath) => ({
    path: relativePath,
    exists: fs.existsSync(path.join(repoRoot, relativePath)),
    text: readText(path.join(repoRoot, relativePath)),
  }))
}

const fixture = readText(fixturePath)
const doc = readText(docPath)
const pkg = JSON.parse(readText(packagePath) || '{}')
const rendererFiles = inspectPublicRendererFiles()
const renderResult = renderStaticArticleHtml(fixturePath)
const html = renderResult.html

const checks = {
  fixtureExists: fs.existsSync(fixturePath),
  docExists: fs.existsSync(docPath),
  packageScriptRegistered: pkg.scripts?.['smoke:cms-markdown-text-block-public-ssot'] === 'node scripts/smoke-cms-markdown-text-block-public-ssot.mjs',
  fixtureHasNativeH1: fixture.includes('# Published H1 From CMS'),
  fixtureHasNativeH2: fixture.includes('## Published H2 From CMS'),
  fixtureHasBodyParagraph: fixture.includes('This paragraph was authored as a CMS body text block.'),
  fixtureHasSecondBodyParagraph: fixture.includes('This second paragraph must remain native markdown, not a directive.'),
  fixtureHasNearbyDirective: fixture.includes('::note'),
  fixtureHasNoPlaceholderSentinel: PLACEHOLDER_SENTINELS.every((sentinel) => !fixture.includes(sentinel)),
  fixtureDoesNotConvertToMarkdownBox: !fixture.includes('::markdown-box'),
  fixtureDoesNotConvertToEditorialTitle: !fixture.includes('::editorial-title'),
  renderOk: renderResult.ok === true,
  h1Rendered: html.includes('<h1>Published H1 From CMS</h1>'),
  h2Rendered: html.includes('<h2>Published H2 From CMS</h2>'),
  firstParagraphRendered: html.includes('<p>This paragraph was authored as a CMS body text block.</p>'),
  secondParagraphRendered: html.includes('<p>This second paragraph must remain native markdown, not a directive.</p>'),
  nearbyDirectiveRendered: html.includes('data-directive="note"'),
  noPlaceholderSentinelInHtml: PLACEHOLDER_SENTINELS.every((sentinel) => !html.includes(sentinel)),
  nativeBlocksNotUnknownDirectives: !renderResult.diagnostics.unknownDirectives.includes('h1') && !renderResult.diagnostics.unknownDirectives.includes('h2') && !renderResult.diagnostics.unknownDirectives.includes('paragraph'),
  noRawTextBlockDirectiveLeak: renderResult.diagnostics.rawDirectiveLeakCount === 0,
  noPublicTextBlockModel: rendererFiles.every((file) => FORBIDDEN_PUBLIC_TEXT_BLOCK_MODEL_TOKENS.every((token) => !file.text.includes(token))),
  directiveTypesRemainDirectiveOnly: readText(path.join(repoRoot, 'src/markdown/directiveTypes.ts')).includes("'markdown-box'") && !readText(path.join(repoRoot, 'src/markdown/directiveTypes.ts')).includes("'markdown-text-block'"),
  docStatesNoPublicTextBlockModel: includesAll(doc, ['No Public Text Block Model', 'Canonical SSOT', 'published markdown source file']),
  noD1R2ApiCoupling: !fixture.includes('D1') && !fixture.includes('R2') && !fixture.includes('Cloudflare API'),
}

const failed = Object.entries(checks).filter(([, ok]) => !ok)
if (failed.length) {
  const detail = failed.map(([key]) => key).join(', ')
  throw new Error('VT-CMS-11 public markdown text block SSOT drift detected: ' + detail)
}

fs.mkdirSync(artifactDir, { recursive: true })
fs.writeFileSync(artifactPath, JSON.stringify({
  schemaVersion: 'vt-cms-11-public-markdown-text-block-ssot@1',
  status: 'PASS_VARUNTOOLS_CMS_MARKDOWN_TEXT_BLOCK_PUBLIC_SSOT',
  fixturePath: path.relative(repoRoot, fixturePath).replace(/\\/g, '/'),
  routePath: renderResult.routePath,
  diagnostics: renderResult.diagnostics,
  checks,
}, null, 2) + '\n')

console.log('PASS_VARUNTOOLS_CMS_MARKDOWN_TEXT_BLOCK_PUBLIC_SSOT')
