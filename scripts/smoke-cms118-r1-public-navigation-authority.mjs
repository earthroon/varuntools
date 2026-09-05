#!/usr/bin/env node
import fs from 'node:fs'
const r=p=>fs.readFileSync(p,'utf8')
const c=[
['same-site',r('src/navigation/navigationTarget.ts').includes('www.varun.tools')],
['showTag',r('src/components/markdown/WorkCard.vue').includes('showTag?: boolean')],
['featured no badge',r('src/components/markdown/FeaturedWorksGrid.vue').includes(':show-tag="false"')],
['nav parent type',r('src/navigation/navigationTypes.ts').includes('parentHref?: string')],
['content nav',r('src/navigation/contentNavigation.ts').includes('showInNav')],
['tree',r('src/navigation/navigationTree.ts').includes('E_NAV_CYCLE')],
['section merge',r('src/navigation/sectionNavigation.ts').includes('canonicalNavigation')],
['header tree',r('src/components/layout/SiteHeader.vue').includes('headerNavigationTree')],
]
let bad=0;for(const [n,o] of c){console.log((o?'PASS ':'FAIL ')+n);if(!o)bad++}if(bad)process.exit(1);console.log('PASS_CMS_118_R1_PUBLIC_AUTHORITY')
