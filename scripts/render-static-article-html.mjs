#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const CONTENT_ROOT = 'src/content/pages'

function normalizeSlash(value) {
  return String(value || '').replace(/\\/g, '/')
}

function trimSlashes(value) {
  return normalizeSlash(value).replace(/^\/+|\/+$/g, '')
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeHtmlAttr(value) {
  return escapeHtml(value).replace(/"/g, '&quot;')
}

function stripBom(value) {
  return String(value || '').replace(/^\uFEFF/, '')
}

export function splitFrontmatter(markdown) {
  const source = stripBom(markdown)
  if (!source.startsWith('---\n') && !source.startsWith('---\r\n')) return { frontmatter: {}, body: source }
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (!match) return { frontmatter: {}, body: source }
  const frontmatter = parseYamlLikeFrontmatter(match[1])
  return { frontmatter, body: source.slice(match[0].length) }
}

function parseYamlLikeFrontmatter(body) {
  const out = {}
  for (const rawLine of String(body || '').split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const index = line.indexOf(':')
    if (index < 0) continue
    const key = line.slice(0, index).trim()
    let value = line.slice(index + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1)
    if (value === 'true') out[key] = true
    else if (value === 'false') out[key] = false
    else if (key) out[key] = value
  }
  return out
}

function routeFromSourcePath(sourcePath, frontmatter = {}) {
  const rel = trimSlashes(path.relative(CONTENT_ROOT, sourcePath))
  const withoutIndex = rel.replace(/\/index\.md$/i, '')
  const parts = withoutIndex.split('/').filter(Boolean)
  const pathCategory = parts[0] || 'page'
  const category = trimSlashes(frontmatter.category || pathCategory || 'page')
  let slug = trimSlashes(frontmatter.slug || withoutIndex)
  if (!slug) slug = withoutIndex
  const routePath = slug === category || slug.startsWith(category + '/') ? '/' + slug : '/' + trimSlashes(category + '/' + slug)
  return { category, slug, routePath }
}

function inlineMarkdown(value) {
  let text = escapeHtml(value)
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>')
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, src) => `<img src="${escapeHtmlAttr(src)}" alt="${escapeHtmlAttr(alt)}">`)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, href) => `<a href="${escapeHtmlAttr(href)}">${label}</a>`)
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  return text
}

function parseDirectiveStart(line) {
  const match = String(line || '').match(/^\s*(:{2,3})\s*([a-zA-Z0-9_-]+)(.*)$/)
  if (!match) return null
  return { fence: match[1], name: match[2], rest: match[3] || '' }
}

function isDirectiveEnd(line) {
  return /^\s*:{2,3}\s*$/.test(String(line || ''))
}

const BODY_DIRECTIVE_NAMES = new Set(['markdown-box', 'note', 'tip', 'warning'])

function isDirectiveAttrLine(line) {
  return /^[a-zA-Z][a-zA-Z0-9_-]*:\s*.*$/.test(String(line || '').trim())
}

function findDirectiveEndIndex(lines, startIndex, name) {
  let firstEnd = -1

  for (let i = startIndex + 1; i < lines.length; i += 1) {
    if (isDirectiveEnd(lines[i])) {
      firstEnd = i
      break
    }
  }

  if (firstEnd < 0) return -1
  if (!BODY_DIRECTIVE_NAMES.has(name)) return firstEnd

  const beforeFirstEnd = lines.slice(startIndex + 1, firstEnd)
  const hasLooseBodyBeforeFirstEnd = beforeFirstEnd.some((line) => {
    const trimmed = String(line || '').trim()
    return Boolean(trimmed) && !isDirectiveAttrLine(trimmed)
  })

  if (hasLooseBodyBeforeFirstEnd) return firstEnd

  for (let i = firstEnd + 1; i < lines.length; i += 1) {
    if (isDirectiveEnd(lines[i])) return i
  }

  return firstEnd
}

function directiveLabel(name) {
  return ({ note: 'Note', warning: 'Warning', tip: 'Tip', 'markdown-box': 'Markdown Box' })[name] || name
}

function splitDirectiveAttrBody(lines) {
  const separatorIndex = lines.findIndex((line) => String(line || '').trim() === '::')
  const attrLines = separatorIndex >= 0 ? lines.slice(0, separatorIndex) : lines
  const bodyLines = separatorIndex >= 0 ? lines.slice(separatorIndex + 1) : []

  const attrs = {}
  const looseBody = []

  for (const line of attrLines) {
    const match = String(line || '').match(/^([a-zA-Z][a-zA-Z0-9_-]*):\s*(.*)$/)
    if (match) attrs[match[1]] = match[2].trim()
    else looseBody.push(line)
  }

  return {
    attrs,
    body: [...looseBody, ...bodyLines].join('\n').trim(),
  }
}

function renderDirective(name, innerMarkdown, diagnostics) {
  diagnostics.directiveCount += 1
  const parsed = splitDirectiveAttrBody(String(innerMarkdown || '').replace(/\r\n/g, '\n').split('\n'))
  const inner = renderMarkdownBody(parsed.body, diagnostics)
  const title = String(parsed.attrs.title || directiveLabel(name)).trim()

  switch (name) {
    case 'note':
    case 'warning':
    case 'tip':
      return `<aside class="markdown-callout markdown-callout-${escapeHtmlAttr(name)}" data-directive="${escapeHtmlAttr(name)}"><div class="markdown-callout-label">${escapeHtml(title)}</div><div class="markdown-callout-body">${inner}</div></aside>`
    case 'markdown-box':
      return `<section class="markdown-box" data-directive="markdown-box">${title ? `<div class="markdown-box-title">${escapeHtml(title)}</div>` : ''}<div class="markdown-box-body">${inner}</div></section>`
    default:
      diagnostics.unknownDirectives.push(name)
      return `<section class="markdown-unknown-directive" data-directive="${escapeHtmlAttr(name)}"><div class="markdown-unknown-directive-body">${inner}</div></section>`
  }
}

export function renderMarkdownBody(markdown, diagnostics = { directiveCount: 0, unknownDirectives: [] }) {
  const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n')
  const out = []
  let paragraph = []
  let list = []
  let blockquote = []
  let codeFence = null
  let codeLines = []

  const flushParagraph = () => {
    if (!paragraph.length) return
    out.push(`<p>${inlineMarkdown(paragraph.join(' ').trim())}</p>`)
    paragraph = []
  }
  const flushList = () => {
    if (!list.length) return
    out.push(`<ul>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join('')}</ul>`)
    list = []
  }
  const flushBlockquote = () => {
    if (!blockquote.length) return
    out.push(`<blockquote>${renderMarkdownBody(blockquote.join('\n'), diagnostics)}</blockquote>`)
    blockquote = []
  }
  const flushAllFlow = () => {
    flushParagraph()
    flushList()
    flushBlockquote()
  }

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    const trimmed = line.trim()

    if (codeFence) {
      if (trimmed.startsWith('```')) {
        out.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`)
        codeFence = null
        codeLines = []
      } else {
        codeLines.push(line)
      }
      continue
    }

    if (trimmed.startsWith('```')) {
      flushAllFlow()
      codeFence = trimmed.slice(3).trim() || 'plain'
      codeLines = []
      continue
    }

    const directive = parseDirectiveStart(line)
    if (directive) {
      const endIndex = findDirectiveEndIndex(lines, i, directive.name)

      if (endIndex >= 0) {
        flushAllFlow()
        const body = lines.slice(i + 1, endIndex)
        out.push(renderDirective(directive.name, body.join('\n'), diagnostics))
        i = endIndex
        continue
      }
    }

    if (!trimmed) {
      flushAllFlow()
      continue
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/)
    if (heading) {
      flushAllFlow()
      const level = heading[1].length
      out.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`)
      continue
    }

    const unordered = trimmed.match(/^[-*+]\s+(.+)$/)
    if (unordered) {
      flushParagraph()
      flushBlockquote()
      list.push(unordered[1])
      continue
    }

    const quote = trimmed.match(/^>\s?(.*)$/)
    if (quote) {
      flushParagraph()
      flushList()
      blockquote.push(quote[1])
      continue
    }

    flushList()
    flushBlockquote()
    paragraph.push(trimmed)
  }

  if (codeFence) out.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`)
  flushAllFlow()
  return out.join('\n')
}

export function renderStaticArticleHtml(sourcePath) {
  const source = fs.readFileSync(sourcePath, 'utf8')
  const { frontmatter, body } = splitFrontmatter(source)
  const route = routeFromSourcePath(sourcePath, frontmatter)
  const title = String(frontmatter.title || frontmatter.name || route.slug.split('/').filter(Boolean).at(-1) || 'Untitled')
  const summary = String(frontmatter.summary || frontmatter.description || '')
  const diagnostics = { directiveCount: 0, unknownDirectives: [] }
  const renderedBody = renderMarkdownBody(body, diagnostics)
  const rawDirectiveLeakCount = (renderedBody.match(/(^|\n)\s*:{2,3}\s*[a-zA-Z0-9_-]+/g) || []).length
  const emptyBody = body.trim().length === 0 || renderedBody.trim().length === 0
  const category = route.category || 'page'
  const article = [
    `<main id="app" data-vacms-static-prerender="true">`,
    `<article class="vacms-static-article" data-vacms-static-article="true" data-vacms-route="${escapeHtmlAttr(route.routePath)}" data-vacms-source="${escapeHtmlAttr(normalizeSlash(sourcePath))}">`,
    `<header class="vacms-static-article-header">`,
    `<p class="vacms-static-article-kicker">${escapeHtml(category)}</p>`,
    `<h1>${inlineMarkdown(title)}</h1>`,
    summary ? `<p class="vacms-static-article-summary">${inlineMarkdown(summary)}</p>` : '',
    `</header>`,
    `<section class="markdown-document vacms-static-article-body">${renderedBody}</section>`,
    `</article>`,
    `</main>`,
  ].filter(Boolean).join('\n')

  return {
    ok: !emptyBody,
    title,
    summary,
    routePath: route.routePath,
    sourcePath: normalizeSlash(sourcePath),
    html: article,
    diagnostics: {
      markdownBodyLength: body.length,
      renderedHtmlLength: renderedBody.length,
      directiveCount: diagnostics.directiveCount,
      unknownDirectives: [...new Set(diagnostics.unknownDirectives)],
      emptyBody,
      rawDirectiveLeakCount,
    },
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const file = process.argv[2]
  if (!file) throw new Error('usage: node scripts/render-static-article-html.mjs <source.md>')
  const result = renderStaticArticleHtml(file)
  process.stdout.write(JSON.stringify(result, null, 2) + '\n')
}
