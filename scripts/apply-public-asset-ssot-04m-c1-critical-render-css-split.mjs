import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const utf8 = 'utf8'

function read(rel) {
  return readFileSync(path.join(root, rel), utf8)
}

function write(rel, text) {
  writeFileSync(path.join(root, rel), text.replace(/^\uFEFF/, ''), utf8)
}

function removeMainCssImport(text, cssPath) {
  const escaped = cssPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(`\\nimport ['\"]\\./styles/${escaped}['\"]`, 'g'), '')
}

function ensureScriptSetupImport(rel, importLine) {
  if (!existsSync(path.join(root, rel))) return
  const text = read(rel)
  if (text.includes(importLine)) return
  const next = text.replace(/<script setup lang="ts">\s*/, `<script setup lang="ts">\n${importLine}\n`)
  write(rel, next)
}

let typography = read('src/styles/typography.css')
typography = typography
  .replace(/^@import\s+url\(['"]https:\/\/cdn\.jsdelivr\.net\/gh\/orioncactus\/pretendard\/dist\/web\/variable\/pretendardvariable\.css['"]\);\s*/m, '')
  .replace(/--vt-font-sans:\s*'Pretendard Variable',\s*'Pretendard',\s*/,
    "--vt-font-sans: ")

if (!typography.includes('--vt-font-brand:')) {
  typography = typography.replace(
    /(--vt-font-sans:[^;]+;)/,
    "$1\n  --vt-font-brand: 'Pretendard Variable', 'Pretendard', var(--vt-font-sans);",
  )
}
write('src/styles/typography.css', typography)

let main = read('src/main.ts')
for (const css of [
  'command-palette.css',
  'page-search.css',
  'markdown-lightbox.css',
]) {
  main = removeMainCssImport(main, css)
}
write('src/main.ts', main)

ensureScriptSetupImport('src/components/CommandPalette.vue', "import '@/styles/command-palette.css'")
ensureScriptSetupImport('src/pages/SearchPage.vue', "import '@/styles/page-search.css'")
ensureScriptSetupImport('src/components/markdown/MarkdownLightbox.vue', "import '@/styles/markdown-lightbox.css'")

console.log('APPLY_PUBLIC_ASSET_SSOT_04M_C1_CRITICAL_RENDER_CSS_SPLIT')
