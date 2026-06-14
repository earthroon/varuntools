import fs from 'node:fs'

function read(path) {
  return fs.readFileSync(path, 'utf8')
}

function assertIncludes(text, needle, label) {
  if (!text.includes(needle)) {
    throw new Error(`[smoke:link-contract] Missing ${label}: ${needle}`)
  }
}

function assertMatches(text, pattern, label) {
  if (!pattern.test(text)) {
    throw new Error(`[smoke:link-contract] Missing ${label}: ${pattern}`)
  }
}

const workCard = read('src/components/markdown/WorkCard.vue')
assertIncludes(workCard, "import { RouterLink } from 'vue-router'", 'WorkCard RouterLink import')
assertIncludes(workCard, ':is="browserHandled ? \'a\' : RouterLink"', 'WorkCard internal RouterLink branch')
assertIncludes(workCard, ':to="browserHandled ? undefined : routeTo"', 'WorkCard route target')
assertIncludes(workCard, `:target="opensNewTab ? '_blank' : undefined"`, 'WorkCard external new-tab guard')
assertIncludes(workCard, 'const external = computed(() => /^(?:[a-z][a-z0-9+.-]*:|\\/\\/)/i.test(safeHref.value))', 'WorkCard external protocol handling')

const documentView = read('src/components/markdown/MarkdownDocumentView.vue')
assertIncludes(documentView, "import { useMarkdownInternalLinks } from '@/composables/useMarkdownInternalLinks'", 'Markdown internal link composable import')
assertIncludes(documentView, 'useMarkdownInternalLinks(markdownRoot)', 'Markdown internal link composable usage')

const internalLinks = read('src/composables/useMarkdownInternalLinks.ts')
assertIncludes(internalLinks, 'router.push(routeHref)', 'Markdown link router push')
assertIncludes(internalLinks, 'FILE_ASSET_RE', 'asset link guard')
assertIncludes(internalLinks, 'import.meta.env.BASE_URL', 'BASE_URL normalization')
assertIncludes(internalLinks, 'target && anchor.target !== \'_self\'', 'target guard')

const registry = read('src/markdown/pageRegistry.ts')
assertIncludes(registry, "map.set(`works/${slug}`, entry)", 'related works prefixed alias')
assertIncludes(registry, "map.set(slug.slice('works/'.length), entry)", 'related works short alias')
assertIncludes(registry, 'function markSeen(slug: string): void', 'related works seen alias guard')

const packageJson = JSON.parse(read('package.json'))
assertIncludes(packageJson.scripts.build, 'node scripts/create-spa-fallback.mjs', 'build SPA fallback')
assertIncludes(packageJson.scripts['smoke:link-contract'], 'scripts/smoke-link-contract.mjs', 'smoke script registration')

const fallback = read('scripts/create-spa-fallback.mjs')
assertIncludes(fallback, 'dist/index.html', 'fallback source')
assertIncludes(fallback, '404.html', 'fallback output')

console.log('[smoke:link-contract] OK')
