import fs from 'node:fs'
import path from 'node:path'

const indexPath = path.join(process.cwd(), 'dist', 'index.html')
const fallbackPath = path.join(process.cwd(), 'dist', '404.html')

if (!fs.existsSync(indexPath)) {
  throw new Error('[spa-fallback] dist/index.html not found. Run vite build first.')
}

fs.copyFileSync(indexPath, fallbackPath)
console.log('[spa-fallback] copied dist/index.html -> dist/404.html')
