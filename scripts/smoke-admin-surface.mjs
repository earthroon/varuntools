#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const exists = (file) => fs.existsSync(path.join(root, file))
const failures = []
const requiredFiles = [
  'admin/package.json','admin/index.html','admin/vite.config.ts','admin/tsconfig.json','admin/src/main.ts','admin/src/App.vue','admin/src/router.ts','admin/src/lib/adminApiClient.ts','admin/src/types/admin.ts','admin/src/views/AdminHome.vue','admin/src/views/OrdersView.vue','admin/src/views/GrantsView.vue','admin/src/views/WebhookEventsView.vue','admin/src/views/ProductsView.vue','admin/src/views/DeliveryIncidentsView.vue','docs/admin/access-boundary.md','docs/admin/surface-boundary.md','docs/admin/deployment.md','docs/migration/commit-76.md'
]
for (const file of requiredFiles) if (!exists(file)) failures.push(`missing required file: ${file}`)
function requireToken(file, token) { if (exists(file) && !read(file).includes(token)) failures.push(`${file} missing token: ${token}`) }
requireToken('docs/admin/access-boundary.md','Cloudflare Access')
requireToken('docs/admin/access-boundary.md','admin.varun.tools')
requireToken('docs/admin/surface-boundary.md','storefront')
requireToken('docs/admin/surface-boundary.md','purchase_orders')
requireToken('docs/admin/surface-boundary.md','purchase_grants')
requireToken('docs/admin/surface-boundary.md','webhook_events')
requireToken('docs/admin/surface-boundary.md','D1')
requireToken('docs/admin/deployment.md','Commit 77')
requireToken('admin/src/lib/adminApiClient.ts','pending-admin-api')
requireToken('admin/src/lib/adminApiClient.ts','Admin API Worker')
requireToken('admin/src/lib/adminApiClient.ts','D1')
requireToken('admin/src/App.vue','Cloudflare Access')
requireToken('admin/src/router.ts','/orders')
requireToken('admin/src/router.ts','/grants')
requireToken('admin/src/router.ts','/webhook-events')
const pkg = JSON.parse(read('package.json'))
for (const name of ['admin:dev','admin:build','admin:preview','smoke:admin-surface']) if (!pkg.scripts?.[name]) failures.push(`package.json missing script: ${name}`)
const checkLaunch = read('scripts/check-launch.mjs')
if (!checkLaunch.includes('scripts/smoke-admin-surface.mjs')) failures.push('check-launch does not include smoke-admin-surface')
function walk(dir) { if (!fs.existsSync(dir)) return []; const out = []; for (const entry of fs.readdirSync(dir,{withFileTypes:true})) { const full = path.join(dir, entry.name); if (entry.isDirectory()) out.push(...walk(full)); else out.push(full) } return out }
for (const file of walk(path.join(root,'src')).filter((f)=>/\.(ts|vue|md)$/.test(f))) {
  const rel = path.relative(root,file)
  const text = fs.readFileSync(file,'utf8')
  if (/path\s*:\s*['"]\/admin\b/.test(text)) failures.push(`storefront has admin route: ${rel}`)
  if (/src\/content\/pages\/admin\b/.test(rel)) failures.push(`storefront has admin content page: ${rel}`)
}
const forbidden = ['CLOUDFLARE_API_TOKEN','D1_REST_TOKEN','env.DB.prepare','D1Database','fetch("https://api.cloudflare.com',"fetch('https://api.cloudflare.com"]
for (const file of walk(path.join(root,'admin')).filter((f)=>/\.(ts|vue|md|json|html)$/.test(f))) {
  const rel = path.relative(root,file)
  const text = fs.readFileSync(file,'utf8')
  for (const token of forbidden) if (text.includes(token)) failures.push(`${rel} contains forbidden admin token: ${token}`)
}
const client = read('admin/src/lib/adminApiClient.ts')
if (/prepare\s*\(/.test(client) || /SELECT\s+/i.test(client)) failures.push('adminApiClient appears to query D1 directly')
if (failures.length) { console.error('[smoke:admin-surface] FAILED'); for (const failure of failures) console.error(`- ${failure}`); process.exit(1) }
console.log('[smoke:admin-surface] OK admin app split and Access boundary contract are present')
