#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const ROOT = process.cwd()
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8')
const checks = []
const check = (name, ok, detail = '') => checks.push({ name, ok: Boolean(ok), detail })

const work = read('src/components/markdown/WorkCard.vue')
const featured = read('src/components/markdown/FeaturedWorksGrid.vue')
const links = read('src/composables/useMarkdownInternalLinks.ts')
const mount = read('src/markdown/mountMarkdownComponents.ts')
const doc = read('src/components/markdown/MarkdownDocumentView.vue')
const routeIndex = read('src/markdown/markdownRouteIndex.generated.ts')

check('markdown directive islands are isolated createApp mounts', mount.includes('const app = createApp(component, props)'))
check('WorkCard no longer owns RouterLink', !work.includes('RouterLink'))
check('WorkCard no longer owns useRouter', !work.includes('useRouter'))
check('WorkCard renders native href authority', work.includes('<a') && work.includes(':href="safeHref"'))
check('MarkdownDocumentView owns markdown internal navigation', doc.includes('useMarkdownInternalLinks(markdownRoot)'))
check('markdown internal navigation uses main router', links.includes('const router = useRouter()') && links.includes('router.push(routeHref)'))
check('router execution error retains native location fallback', links.includes('window.location.assign(nativeHref)'))
check('manual FeaturedWorks direct-resolves target metadata', featured.includes('loadMarkdownPageBySlug') && featured.includes('resolveManualItem'))
check('manual FeaturedWorks cannot disappear while items exist', featured.includes('shouldRenderSection') && featured.includes('manualItems.value.length > 0 || entries.value.length > 0'))
check('global pages hydration is not required for manual target resolution', featured.includes('const exactPage = targetSlug ? await loadMarkdownPageBySlug(targetSlug) : null'))

const physicalTargets = [
  ['post/portfolio', 'src/content/pages/post/portfolio/index.md'],
  ['post/printtest', 'src/content/pages/post/printtest/index.md'],
  ['post/diecut', 'src/content/pages/post/diecut/index.md'],
]
for (const [slug, rel] of physicalTargets) {
  if (!fs.existsSync(path.join(ROOT, rel))) continue
  check(`route index contains physical target ${slug}`, routeIndex.includes(`slug: "${slug}"`))
}

let failed = 0
for (const item of checks) {
  console.log(`${item.ok ? 'PASS' : 'FAIL'} ${item.name}${item.detail ? ` :: ${item.detail}` : ''}`)
  if (!item.ok) failed += 1
}
if (failed) {
  console.error(`CMS-118-R1A-R3 PUBLIC smoke FAILED (${failed})`)
  process.exit(1)
}
console.log('PASS_CMS_118_R1A_R3_MARKDOWN_ISLAND_NAVIGATION_CONTEXT')
