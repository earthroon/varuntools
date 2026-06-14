#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'; import path from 'node:path'; import process from 'node:process'
const root=process.cwd(), errors=[]; const f=(r)=>path.join(root,r), r=(p)=>readFileSync(f(p),'utf8'), e=(c,m)=>{if(!c)errors.push(m)}
for(const p of ['src/content/pages/claim/index.md','src/components/ClaimPortal.vue','src/types/claim.ts','src/utils/claimClient.ts','src/markdown/directives/claimPortalDirective.ts','docs/authoring/buyer-claim-flow.md','docs/migration/commit-71.md']) e(existsSync(f(p)),`missing ${p}`)
const page=r('src/content/pages/claim/index.md'), comp=r('src/components/ClaimPortal.vue'), dt=r('src/markdown/directiveTypes.ts'), di=r('src/markdown/directives/index.ts'), mt=r('src/markdown/mountMarkdownComponents.ts')
e(page.includes('slug: "claim"'),'claim page slug missing'); e(page.includes('::claim-portal'),'claim directive missing'); e(page.includes('noindex,follow'),'noindex missing')
for(const t of ['claimToken','orderId','email','role="status"','role="alert"','aria-busy']) e(comp.includes(t),`component missing ${t}`)
for(const t of ['gateCode','localStorage','sessionStorage','publicUrl','r2Key','downloadUrl']) e(!comp.includes(t),`component must not include ${t}`)
e(dt.includes("'claim-portal'"),'directiveTypes missing claim-portal'); e(di.includes('renderClaimPortalDirective'),'directive renderer missing'); e(mt.includes('ClaimPortal')&&mt.includes('data-vt-component="claim-portal"'),'mount missing ClaimPortal')
const pkg=JSON.parse(r('package.json')); e(pkg.scripts['smoke:claim-portal']==='node scripts/smoke-claim-portal.mjs','package script missing')
if(errors.length){for(const x of errors)console.error('ERROR '+x); process.exit(1)} console.log('[smoke:claim-portal] OK buyer claim portal is wired')
