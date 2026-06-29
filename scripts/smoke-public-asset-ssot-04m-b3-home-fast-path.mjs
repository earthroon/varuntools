import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const ROOT = process.cwd()

function read(rel) {
  const full = path.join(ROOT, rel)
  if (!fs.existsSync(full)) throw new Error(`Missing file: ${rel}`)
  return fs.readFileSync(full, 'utf8')
}

function assertIncludes(text, token, file) {
  if (!text.includes(token)) throw new Error(`${file} must include ${token}`)
}

function assertNotIncludes(text, token, file) {
  if (text.includes(token)) throw new Error(`${file} must not include ${token}`)
}

function assertJsonHasNoHeavyKeys(value, trail = []) {
  if (!value || typeof value !== 'object') return
  for (const [key, child] of Object.entries(value)) {
    if (key === 'raw' || key === 'html' || key === 'headings') {
      throw new Error(`homeCollections.generated.json has forbidden key ${[...trail, key].join('.')}`)
    }
    assertJsonHasNoHeavyKeys(child, [...trail, key])
  }
}

const generatedPath = path.join(ROOT, 'src/content/generated/homeCollections.generated.json')
if (!fs.existsSync(generatedPath)) throw new Error('src/content/generated/homeCollections.generated.json is missing')
const generated = JSON.parse(fs.readFileSync(generatedPath, 'utf8'))
if (generated.schemaVersion !== 'home-collections.v1') throw new Error('homeCollections.generated.json schemaVersion mismatch')
if (!Array.isArray(generated.entries)) throw new Error('homeCollections.generated.json entries must be an array')
assertJsonHasNoHeavyKeys(generated)

const useHomeCollections = read('src/composables/useHomeCollections.ts')
assertIncludes(useHomeCollections, 'useHomeCollections', 'src/composables/useHomeCollections.ts')
assertIncludes(useHomeCollections, 'normalizeRuntimeHomeCollectionEntry', 'src/composables/useHomeCollections.ts')
assertNotIncludes(useHomeCollections, 'LoadedMarkdownPage', 'src/composables/useHomeCollections.ts')
assertNotIncludes(useHomeCollections, 'loadMarkdownPages', 'src/composables/useHomeCollections.ts')

const homePage = read('src/pages/HomePage.vue')
assertNotIncludes(homePage, 'useRouteManifest', 'src/pages/HomePage.vue')
assertNotIncludes(homePage, 'findMarkdownPageBySlug', 'src/pages/HomePage.vue')
assertIncludes(homePage, 'loadMarkdownPageBySlug', 'src/pages/HomePage.vue')
assertIncludes(homePage, "loadMarkdownPageBySlug('home')", 'src/pages/HomePage.vue')
assertIncludes(homePage, 'afterFirstPaint', 'src/pages/HomePage.vue')
assertIncludes(homePage, 'canMountHomeCollections', 'src/pages/HomePage.vue')
assertIncludes(homePage, ':show-related-footer="false"', 'src/pages/HomePage.vue')
assertIncludes(homePage, 'HomeRecentPublicContent', 'src/pages/HomePage.vue')
assertIncludes(homePage, 'HomeFeaturedWorks', 'src/pages/HomePage.vue')

const recent = read('src/components/home/HomeRecentPublicContent.vue')
assertNotIncludes(recent, 'useRouteManifest', 'src/components/home/HomeRecentPublicContent.vue')
assertNotIncludes(recent, 'usePublicContentCollection', 'src/components/home/HomeRecentPublicContent.vue')
assertIncludes(recent, 'useHomeCollections', 'src/components/home/HomeRecentPublicContent.vue')
assertIncludes(recent, 'useRuntimePublicContentIndex', 'src/components/home/HomeRecentPublicContent.vue')
assertIncludes(recent, 'generated-home-collections', 'src/components/home/HomeRecentPublicContent.vue')

const featured = read('src/components/home/HomeFeaturedWorks.vue')
assertNotIncludes(featured, 'LoadedMarkdownPage', 'src/components/home/HomeFeaturedWorks.vue')
assertNotIncludes(featured, 'getWorkCollectionEntries', 'src/components/home/HomeFeaturedWorks.vue')
assertNotIncludes(featured, 'pages:', 'src/components/home/HomeFeaturedWorks.vue')
assertNotIncludes(featured, ':pages', 'src/components/home/HomeFeaturedWorks.vue')
assertIncludes(featured, 'useHomeCollections', 'src/components/home/HomeFeaturedWorks.vue')
assertIncludes(featured, 'featuredWorks', 'src/components/home/HomeFeaturedWorks.vue')

const buildScript = read('scripts/build-home-collections.mjs')
assertNotIncludes(buildScript, 'renderMarkdownPage', 'scripts/build-home-collections.mjs')
assertNotIncludes(buildScript, 'loadMarkdownPages', 'scripts/build-home-collections.mjs')
assertIncludes(buildScript, 'home-collections.v1', 'scripts/build-home-collections.mjs')
assertIncludes(buildScript, 'readFrontmatter', 'scripts/build-home-collections.mjs')

console.log('PASS_PUBLIC_ASSET_SSOT_04M_B3_HOME_FAST_PATH')
