import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const distDir = resolve(root, 'dist')
const indexFile = resolve(distDir, 'index.html')
const fallbackFile = resolve(distDir, '404.html')

if (!existsSync(indexFile)) {
  console.error('[VARUNTOOLS][deploy] dist/index.html not found. Run vite build first.')
  process.exit(1)
}

copyFileSync(indexFile, fallbackFile)

console.log('[VARUNTOOLS][deploy] Created dist/404.html SPA fallback.')
