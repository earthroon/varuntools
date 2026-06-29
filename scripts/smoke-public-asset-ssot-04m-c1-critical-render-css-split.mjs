import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()

function read(rel) {
  const file = path.join(root, rel)
  if (!existsSync(file)) throw new Error(`Missing file: ${rel}`)
  return readFileSync(file, 'utf8')
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertNotIncludes(text, token, file) {
  assert(!text.includes(token), `${file} must not include ${token}`)
}

function assertIncludes(text, token, file) {
  assert(text.includes(token), `${file} must include ${token}`)
}

const typography = read('src/styles/typography.css')
const main = read('src/main.ts')
const commandPalette = read('src/components/CommandPalette.vue')
const searchPage = read('src/pages/SearchPage.vue')
const lightbox = read('src/components/markdown/MarkdownLightbox.vue')

assertNotIncludes(typography, 'cdn.jsdelivr.net', 'typography.css')
assertNotIncludes(typography, '@import url(\'https://', 'typography.css')
assertNotIncludes(typography, '@import url("https://', 'typography.css')
assertIncludes(typography, '--vt-font-sans:', 'typography.css')
assertIncludes(typography, 'system-ui', 'typography.css')

assertNotIncludes(main, 'command-palette.css', 'main.ts')
assertNotIncludes(main, 'page-search.css', 'main.ts')
assertNotIncludes(main, 'markdown-lightbox.css', 'main.ts')
assertIncludes(commandPalette, "@/styles/command-palette.css", 'CommandPalette.vue')
assertIncludes(searchPage, "@/styles/page-search.css", 'SearchPage.vue')
assertIncludes(lightbox, "@/styles/markdown-lightbox.css", 'MarkdownLightbox.vue')

console.log('PASS_PUBLIC_ASSET_SSOT_04M_C1_CRITICAL_RENDER_CSS_SPLIT')
