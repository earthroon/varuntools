import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const PASS = 'PASS_PUBLIC_ASSET_SSOT_04M_B3_R2_HOME_CRITICAL_RENDER_STABILITY'

function read(rel) {
  const abs = path.join(ROOT, rel)
  if (!fs.existsSync(abs)) throw new Error(`Missing required file: ${rel}`)
  return fs.readFileSync(abs, 'utf8')
}

function assertIncludes(text, needle, label) {
  if (!text.includes(needle)) throw new Error(`${label} must include ${needle}`)
}

function assertNotIncludes(text, needle, label) {
  if (text.includes(needle)) throw new Error(`${label} must not include ${needle}`)
}

function assertNoGeneratedPayloadKeys(value, trail = 'homeCollections.generated.json') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoGeneratedPayloadKeys(item, `${trail}[${index}]`))
    return
  }
  if (!value || typeof value !== 'object') return
  for (const [key, child] of Object.entries(value)) {
    if (key === 'raw' || key === 'html' || key === 'headings') {
      throw new Error(`${trail} must not include rendered/raw payload key: ${key}`)
    }
    assertNoGeneratedPayloadKeys(child, `${trail}.${key}`)
  }
}

const homePage = read('src/pages/HomePage.vue')
const recent = read('src/components/home/HomeRecentPublicContent.vue')
const featured = read('src/components/home/HomeFeaturedWorks.vue')
const homeCollections = read('src/composables/useHomeCollections.ts')
const buildHomeCollections = read('scripts/build-home-collections.mjs')
const generatedPath = path.join(ROOT, 'src/content/generated/homeCollections.generated.json')
if (!fs.existsSync(generatedPath)) throw new Error('Missing generated home collections index')
const generated = JSON.parse(fs.readFileSync(generatedPath, 'utf8'))

assertIncludes(homePage, "@/content/pages/home/index.md?raw", 'HomePage.vue')
assertIncludes(homePage, 'loadMarkdownPageFromSource', 'HomePage.vue')
assertIncludes(homePage, '<HomeRecentPublicContent />', 'HomePage.vue')
assertIncludes(homePage, '<HomeFeaturedWorks />', 'HomePage.vue')
assertIncludes(homePage, ':show-related-footer="false"', 'HomePage.vue')
assertNotIncludes(homePage, 'useRouteManifest', 'HomePage.vue')
assertNotIncludes(homePage, 'findMarkdownPageBySlug', 'HomePage.vue')
assertNotIncludes(homePage, 'loadMarkdownPageBySlug', 'HomePage.vue')
assertNotIncludes(homePage, 'afterFirstPaint', 'HomePage.vue')
assertNotIncludes(homePage, 'canMountHomeCollections', 'HomePage.vue')
assertNotIncludes(homePage, 'v-if="canMountHomeCollections"', 'HomePage.vue')

assertIncludes(recent, 'useHomeCollections', 'HomeRecentPublicContent.vue')
assertIncludes(recent, 'data-vacms-home-recent-source="generated-home-collections"', 'HomeRecentPublicContent.vue')
assertNotIncludes(recent, 'useRouteManifest', 'HomeRecentPublicContent.vue')
assertNotIncludes(recent, 'usePublicContentCollection', 'HomeRecentPublicContent.vue')
assertNotIncludes(recent, 'useRuntimePublicContentIndex', 'HomeRecentPublicContent.vue')
assertNotIncludes(recent, 'runtimeStatus', 'HomeRecentPublicContent.vue')
assertNotIncludes(recent, 'runtimeEntries', 'HomeRecentPublicContent.vue')

assertIncludes(featured, 'useHomeCollections', 'HomeFeaturedWorks.vue')
assertNotIncludes(featured, 'LoadedMarkdownPage', 'HomeFeaturedWorks.vue')
assertNotIncludes(featured, 'getWorkCollectionEntries', 'HomeFeaturedWorks.vue')
assertNotIncludes(featured, 'pages:', 'HomeFeaturedWorks.vue')
assertNotIncludes(featured, 'props.pages', 'HomeFeaturedWorks.vue')

assertIncludes(homeCollections, 'homeCollections.generated.json', 'useHomeCollections.ts')
assertNotIncludes(homeCollections, 'loadMarkdownPages', 'useHomeCollections.ts')
assertNotIncludes(homeCollections, 'useRouteManifest', 'useHomeCollections.ts')

assertNotIncludes(buildHomeCollections, 'renderMarkdownPage', 'build-home-collections.mjs')
assertNotIncludes(buildHomeCollections, 'loadMarkdownPages', 'build-home-collections.mjs')
assertNoGeneratedPayloadKeys(generated)

console.log(PASS)
