#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
let passes = 0
const failures = []

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8').replace(/\\r\\n/g, '\\n')
}
function check(label, condition) {
  if (condition) {
    passes += 1
    console.log('PASS ' + label)
  } else {
    failures.push(label)
    console.error('FAIL ' + label)
  }
}
function featuredBlocks(css) {
  return [...css.matchAll(/\\.vt-home-featured-works\\s*\\{([^}]*)\\}/g)].map((match) => match[1])
}

const home = read('src/pages/HomePage.vue')
const featured = read('src/components/home/HomeFeaturedWorks.vue')
const works = read('src/styles/markdown-works.css')
const u1Apply = read('scripts/apply-public-asset-ssot-04m-u1-mobile-toc-gutter-reserve.mjs')
const u1Smoke = read('scripts/smoke-public-asset-ssot-04m-u1-mobile-toc-gutter-reserve.mjs')
const u1r2Apply = read('scripts/apply-public-asset-ssot-04m-u1-r2-vue-owned-mobile-toc.mjs')
const u1r2Smoke = read('scripts/smoke-public-asset-ssot-04m-u1-r2-vue-owned-mobile-toc.mjs')

check(
  'featured consumer remains directly wired',
  home.includes('<HomeFeaturedWorks />')
    && home.includes("import HomeFeaturedWorks from '@/components/home/HomeFeaturedWorks.vue'"),
)
check('recent consumer remains retired', !home.includes('HomeRecentPublicContent'))
check('featured wrapper is physically absent', !home.includes('vt-home-late-container--featured'))
check('featured wrapper data marker is absent', !home.includes('data-vacms-late-container="featured"'))
check('component owns zero-candidate no-render', featured.includes('v-if="visibleWorks.length"'))

check('featured min-height variable retired', !works.includes('--vt-home-featured-min-height'))
check('featured late-container selector retired', !works.includes('.vt-home-late-container--featured'))
check(
  'u1-r2 featured reserve block retired',
  !works.includes('PUBLIC-ASSET-SSOT-04M-U1-R2 late container reserve:start'),
)
check(
  'featured CSS uses natural flow',
  featuredBlocks(works).every((body) =>
    !body.includes('min-height:')
    && !body.includes('contain-intrinsic-size:')
    && !body.includes('content-visibility:')
  ),
)

check(
  'legacy U1 apply cannot restore featured reservation',
  !u1Apply.includes('--vt-home-featured-min-height')
    && !u1Apply.includes("if (!text.includes('vt-home-late-container--featured'))")
    && !u1Apply.includes('/\\n\\s*<HomeFeaturedWorks\\s*\\/>')
    && u1Apply.includes('stale featured late-container must not be restored'),
)
check(
  'legacy U1 smoke protects absence instead of old bug',
  u1Smoke.includes("assertNotIncludes(works, '--vt-home-featured-min-height'")
    && u1Smoke.includes("assertNotIncludes(homePage, 'vt-home-late-container--featured'"),
)
check(
  'legacy U1-R2 apply removes stale reserve',
  u1r2Apply.includes('works = works.replace(')
    && !u1r2Apply.includes('min-height: clamp(260px, 42vh, 520px)'),
)
check(
  'legacy U1-R2 smoke protects reserve absence',
  u1r2Smoke.includes("assertNotIncludes(works, 'PUBLIC-ASSET-SSOT-04M-U1-R2 late container reserve:start'")
    && u1r2Smoke.includes("assertNotIncludes(works, 'contain-intrinsic-size: 420px'"),
)

if (failures.length) {
  console.error(
    'VT-PUBLIC-24-R2 FAILED '
      + passes
      + '/'
      + (passes + failures.length)
      + ': '
      + failures.join(', '),
  )
  process.exit(1)
}

console.log('VT-PUBLIC-24-R2 PASS ' + passes + '/' + passes)
