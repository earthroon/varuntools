#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const PATCH_ID = 'PUBLIC-ASSET-SSOT-04M-H2'
const PASS_TOKEN = 'PASS_PUBLIC_ASSET_SSOT_04M_H2_HOME_RHYTHM_RECLAIM_APPLY'
const root = process.cwd()

function read(rel) {
  const full = path.join(root, rel)
  if (!fs.existsSync(full)) throw new Error(`[${PATCH_ID}] missing file: ${rel}`)
  return fs.readFileSync(full, 'utf8')
}

function write(rel, text) {
  fs.writeFileSync(path.join(root, rel), text, 'utf8')
}

function replaceRequired(text, from, to, label) {
  if (!text.includes(from)) throw new Error(`[${PATCH_ID}] missing marker: ${label}`)
  return text.replace(from, to)
}

function removeMarkedBlock(text, startToken, endToken) {
  const start = text.indexOf(startToken)
  if (start < 0) return text
  const end = text.indexOf(endToken, start)
  if (end < 0) throw new Error(`[${PATCH_ID}] unterminated block: ${startToken}`)
  return text.slice(0, start).trimEnd() + '\n\n' + text.slice(end + endToken.length).trimStart()
}

function ensureMarkdownDocumentCompactShell() {
  const rel = 'src/components/markdown/MarkdownDocumentView.vue'
  let text = read(rel)

  if (!text.includes('const articleClass = computed(')) {
    const propsNeedle = "    showRelatedFooter?: boolean\n"
    if (!text.includes('pageShell?:')) {
      text = replaceRequired(
        text,
        propsNeedle,
        propsNeedle + "    pageShell?: 'default' | 'compact'\n",
        'MarkdownDocumentView pageShell prop',
      )
    }

    const defaultsNeedle = "    showRelatedFooter: true,\n"
    if (!text.includes("pageShell: 'default'")) {
      text = replaceRequired(
        text,
        defaultsNeedle,
        defaultsNeedle + "    pageShell: 'default',\n",
        'MarkdownDocumentView pageShell default',
      )
    }

    const insertAfter = "const shouldShowToc = computed(() => props.showToc && headings.value.length > 0)\n"
    const articleClassBlock = `\nconst articleClass = computed(() => [\n  'vt-markdown-page',\n  'theme-showroom',\n  props.pageShell === 'compact' ? 'vt-markdown-page--compact' : '',\n])\n`
    text = replaceRequired(text, insertAfter, insertAfter + articleClassBlock, 'MarkdownDocumentView articleClass computed')
  }

  text = text.replace(
    '<article class="vt-markdown-page theme-showroom">',
    '<article :class="articleClass">',
  )

  write(rel, text)
}

function ensureHomePageCompactShell() {
  const rel = 'src/pages/HomePage.vue'
  let text = read(rel)

  if (!text.includes('page-shell="compact"')) {
    text = text.replace(/<MarkdownDocumentView\b([^>]*?)\n/s, (match) => {
      return match.includes('page-shell=') ? match : match.replace('\n', '\n      page-shell="compact"\n')
    })
  }

  if (!text.includes('page-shell="compact"')) {
    throw new Error(`[${PATCH_ID}] failed to bind HomePage MarkdownDocumentView page-shell compact`)
  }

  write(rel, text)
}

function ensureMarkdownCssCompactRhythm() {
  const rel = 'src/styles/markdown.css'
  let text = read(rel)

  const start = '/* PUBLIC-ASSET-SSOT-04M-H2 home rhythm reclaim:start */'
  const end = '/* PUBLIC-ASSET-SSOT-04M-H2 home rhythm reclaim:end */'
  text = removeMarkedBlock(text, start, end)

  const block = `\n${start}\n.vt-markdown-page--compact {\n  min-height: 0;\n}\n\n.vt-markdown-page--compact .vt-markdown {\n  margin-bottom: 0;\n}\n\n@media (min-width: 901px) {\n  .vt-markdown-page--compact {\n    padding-bottom: clamp(24px, 4vw, 52px);\n  }\n}\n\n@media (max-width: 900px) {\n  .vt-markdown-page--compact {\n    padding-bottom: clamp(18px, 5vw, 32px);\n  }\n}\n${end}\n`
  text = text.trimEnd() + '\n' + block
  write(rel, text)
}

function removeOverbroadLateReserveBlocks() {
  const startTokens = [
    '/* PUBLIC-ASSET-SSOT-04M-U1-R2 late container reserve:start */',
    '/* PUBLIC-ASSET-SSOT-04M-U1 late container reserve:start */',
    '/\\* PUBLIC-ASSET-SSOT-04M-U1-R2 late container reserve:start \\*/',
    '/\\* PUBLIC-ASSET-SSOT-04M-U1 late container reserve:start \\*/',
  ]
  const endTokens = [
    '/* PUBLIC-ASSET-SSOT-04M-U1-R2 late container reserve:end */',
    '/* PUBLIC-ASSET-SSOT-04M-U1 late container reserve:end */',
    '/\\* PUBLIC-ASSET-SSOT-04M-U1-R2 late container reserve:end \\*/',
    '/\\* PUBLIC-ASSET-SSOT-04M-U1 late container reserve:end \\*/',
  ]

  const rels = [
    'src/components/home/HomeRecentPublicContent.vue',
    'src/styles/markdown-works.css',
    'src/styles/generated-content.css',
    'src/styles/markdown.css',
  ]

  for (const rel of rels) {
    const full = path.join(root, rel)
    if (!fs.existsSync(full)) continue
    let text = fs.readFileSync(full, 'utf8')
    for (let i = 0; i < startTokens.length; i += 1) {
      let changed = true
      while (changed) {
        const before = text
        text = removeMarkedBlock(text, startTokens[i], endTokens[i])
        changed = text !== before
      }
    }
    text = text.replaceAll('/\\*', '/*').replaceAll('\\*/', '*/')
    fs.writeFileSync(full, text, 'utf8')
  }
}

ensureMarkdownDocumentCompactShell()
ensureHomePageCompactShell()
ensureMarkdownCssCompactRhythm()
removeOverbroadLateReserveBlocks()

console.log(PASS_TOKEN)
