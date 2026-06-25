import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const root = process.cwd()
const distDir = resolve(root, 'dist')
const indexFile = resolve(distDir, 'index.html')

const STATIC_SHELL_ROUTES = [
  'works',
  'products',
  'tools',
  'lab',
  'page',
  'post',
]

if (!existsSync(indexFile)) {
  console.error('[CMS-208D] dist/index.html missing. Run build first.')
  process.exit(1)
}

for (const route of STATIC_SHELL_ROUTES) {
  const target = resolve(distDir, route, 'index.html')
  mkdirSync(dirname(target), { recursive: true })
  copyFileSync(indexFile, target)
  console.log('[CMS-208D] materialized shell route: /' + route + '/index.html')
}

console.log('PASS_CMS_208D_STATIC_SHELL_ROUTE_MATERIALIZATION')
