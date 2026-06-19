#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
const required = [
  'src/index.ts',
  'src/http.ts',
  'src/types.ts',
  'src/validation.ts',
  'src/rateLimit.ts',
  'src/worker-runtime.d.ts',
]
for (const file of required) {
  if (!existsSync(new URL(`../${file}`, import.meta.url))) {
    console.error(`[inquiry-api:typecheck] missing ${file}`)
    process.exit(1)
  }
}
const index = readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8')
if (!index.includes('/api/inquiries')) {
  console.error('[inquiry-api:typecheck] missing /api/inquiries route anchor')
  process.exit(1)
}
console.log('[inquiry-api:typecheck] OK contract files are present')
