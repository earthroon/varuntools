import fs from 'node:fs'
import path from 'node:path'

export const CMS_MARKDOWN_TEXT_DRAFT_PLACEHOLDERS = [
  '[새 제목을 입력하세요]',
  '[새 소제목을 입력하세요]',
  '[본문을 입력하세요]',
]

export const CMS_MARKDOWN_TEXT_PLACEHOLDER_GUARD_ARTIFACT =
  'artifacts/cms/markdown-text-placeholder-public-guard.vt-cms-12.json'

const IGNORED_DIR_NAMES = new Set(['.git', 'node_modules', 'dist', 'artifacts', '.tmp'])

function normalizeSlash(value) {
  return String(value || '').replace(/\\/g, '/')
}

function toRelativeFile(rootDir, filePath) {
  return normalizeSlash(path.relative(rootDir, filePath))
}

function walkMarkdownFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (IGNORED_DIR_NAMES.has(entry.name)) continue
      walkMarkdownFiles(path.join(dir, entry.name), out)
      continue
    }
    if (!entry.isFile()) continue
    if (!entry.name.toLowerCase().endsWith('.md')) continue
    out.push(path.join(dir, entry.name))
  }
  return out.sort((a, b) => normalizeSlash(a).localeCompare(normalizeSlash(b)))
}

function lineColumnAt(source, index) {
  const before = source.slice(0, index)
  const lines = before.split(/\n/u)
  return {
    line: lines.length,
    column: (lines.at(-1)?.length ?? 0) + 1,
  }
}

function excerptFor(source, index, length) {
  const lineStart = source.lastIndexOf('\n', index - 1) + 1
  const nextLineBreak = source.indexOf('\n', index + length)
  const lineEnd = nextLineBreak < 0 ? source.length : nextLineBreak
  return source.slice(lineStart, lineEnd).trim().slice(0, 180)
}

function issuesForFile({ rootDir, filePath, source }) {
  const issues = []
  for (const placeholder of CMS_MARKDOWN_TEXT_DRAFT_PLACEHOLDERS) {
    let cursor = 0
    while (cursor <= source.length) {
      const index = source.indexOf(placeholder, cursor)
      if (index < 0) break
      const position = lineColumnAt(source, index)
      issues.push({
        file: toRelativeFile(rootDir, filePath),
        placeholder,
        line: position.line,
        column: position.column,
        excerpt: excerptFor(source, index, placeholder.length),
      })
      cursor = index + placeholder.length
    }
  }
  return issues.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column)
}

export function writeMarkdownTextPlaceholderGuardArtifact(report, {
  rootDir = process.cwd(),
  artifactPath = CMS_MARKDOWN_TEXT_PLACEHOLDER_GUARD_ARTIFACT,
} = {}) {
  const target = path.resolve(rootDir, artifactPath)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, JSON.stringify(report, null, 2) + '\n')
  return target
}

export function scanMarkdownTextDraftPlaceholdersInContent({
  rootDir = process.cwd(),
  contentRoot = 'src/content/pages',
  writeArtifact = false,
  artifactPath = CMS_MARKDOWN_TEXT_PLACEHOLDER_GUARD_ARTIFACT,
} = {}) {
  const absoluteRoot = path.resolve(rootDir)
  const absoluteContentRoot = path.resolve(absoluteRoot, contentRoot)
  const files = walkMarkdownFiles(absoluteContentRoot)
  const issues = []

  for (const filePath of files) {
    const source = fs.readFileSync(filePath, 'utf8')
    issues.push(...issuesForFile({ rootDir: absoluteRoot, filePath, source }))
  }

  const report = {
    schemaVersion: 'vt-cms-12-markdown-text-placeholder-public-guard@1',
    ok: issues.length === 0,
    contentRoot: normalizeSlash(contentRoot),
    scannedFileCount: files.length,
    issueCount: issues.length,
    placeholders: [...CMS_MARKDOWN_TEXT_DRAFT_PLACEHOLDERS],
    issues,
  }

  if (writeArtifact) {
    writeMarkdownTextPlaceholderGuardArtifact(report, { rootDir: absoluteRoot, artifactPath })
  }

  return report
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = scanMarkdownTextDraftPlaceholdersInContent({ writeArtifact: true })
  if (!report.ok) {
    console.error(JSON.stringify(report, null, 2))
    process.exitCode = 1
  } else {
    console.log(JSON.stringify(report, null, 2))
  }
}
