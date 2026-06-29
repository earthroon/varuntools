import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const ROOT = process.cwd()

function read(rel) {
  const full = path.join(ROOT, rel)
  if (!fs.existsSync(full)) {
    throw new Error(`Missing required file: ${rel}`)
  }
  return fs.readFileSync(full, 'utf8')
}

function assertIncludes(text, needle, label) {
  if (!text.includes(needle)) {
    throw new Error(`${label} must include ${JSON.stringify(needle)}`)
  }
}

function assertNotIncludes(text, needle, label) {
  if (text.includes(needle)) {
    throw new Error(`${label} must not include ${JSON.stringify(needle)}`)
  }
}

function assertMatch(text, pattern, label) {
  if (!pattern.test(text)) {
    throw new Error(`${label} must match ${pattern}`)
  }
}

function assertNotMatch(text, pattern, label) {
  if (pattern.test(text)) {
    throw new Error(`${label} must not match ${pattern}`)
  }
}

const loader = read('src/markdown/lazyMarkdownPageLoader.ts')
const sourceLoader = read('src/markdown/loadMarkdownPageFromSource.ts')
const legacyLoader = read('src/markdown/loadMarkdownPages.ts')
const routeIndex = read('src/markdown/markdownRouteIndex.generated.ts')
const markdownPage = read('src/pages/MarkdownPage.vue')
const documentView = read('src/components/markdown/MarkdownDocumentView.vue')
const buildIndex = read('scripts/build-markdown-route-index.mjs')

assertIncludes(sourceLoader, 'export function loadMarkdownPageFromSource', 'loadMarkdownPageFromSource.ts')
assertIncludes(sourceLoader, 'renderMarkdownPage', 'loadMarkdownPageFromSource.ts')
assertIncludes(sourceLoader, 'parseFrontmatter', 'loadMarkdownPageFromSource.ts')

assertIncludes(legacyLoader, "import { loadMarkdownPageFromSource }", 'loadMarkdownPages.ts')
assertIncludes(legacyLoader, 'loadMarkdownPageFromSource(source, contentDir)', 'loadMarkdownPages.ts')

assertIncludes(loader, 'import.meta.glob', 'lazyMarkdownPageLoader.ts')
assertNotMatch(loader, /eager\s*:\s*true/, 'lazyMarkdownPageLoader.ts')
assertIncludes(loader, 'loadMarkdownPageFromSource', 'lazyMarkdownPageLoader.ts')
assertIncludes(loader, 'export async function loadMarkdownPageBySlug', 'lazyMarkdownPageLoader.ts')
assertNotIncludes(loader, 'loadMarkdownPages', 'lazyMarkdownPageLoader.ts')
assertNotIncludes(loader, 'useRouteManifest', 'lazyMarkdownPageLoader.ts')

assertIncludes(routeIndex, 'MarkdownRouteIndexEntry', 'markdownRouteIndex.generated.ts')
assertIncludes(routeIndex, 'markdownRouteIndexEntries', 'markdownRouteIndex.generated.ts')
assertNotMatch(routeIndex, /\braw\b/, 'markdownRouteIndex.generated.ts')
assertNotMatch(routeIndex, /\bhtml\b/, 'markdownRouteIndex.generated.ts')
assertNotMatch(routeIndex, /\bheadings\b/, 'markdownRouteIndex.generated.ts')

assertNotIncludes(markdownPage, 'useRouteManifest', 'MarkdownPage.vue')
assertNotIncludes(markdownPage, 'findMarkdownPageBySlug', 'MarkdownPage.vue')
assertIncludes(markdownPage, 'loadMarkdownPageBySlug', 'MarkdownPage.vue')
assertIncludes(markdownPage, 'requestId', 'MarkdownPage.vue')
assertIncludes(markdownPage, 'show-related-footer="false"', 'MarkdownPage.vue')
assertIncludes(markdownPage, 'MarkdownRouteLoadState', 'MarkdownPage.vue')

assertMatch(documentView, /pages\?:\s*LoadedMarkdownPage\[\]/, 'MarkdownDocumentView.vue')
assertIncludes(documentView, 'pages: () => []', 'MarkdownDocumentView.vue')
assertIncludes(documentView, 'pagesRef.value.length', 'MarkdownDocumentView.vue')
assertIncludes(documentView, 'getWorkDetailContext(pagesRef.value', 'MarkdownDocumentView.vue')

assertIncludes(buildIndex, 'buildEntries', 'build-markdown-route-index.mjs')
assertIncludes(buildIndex, '--check', 'build-markdown-route-index.mjs')
assertNotIncludes(buildIndex, 'renderMarkdownPage', 'build-markdown-route-index.mjs')

console.log('PASS_PUBLIC_ASSET_SSOT_04M_B2_CURRENT_ROUTE_LAZY_MARKDOWN')
