#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import process from 'node:process'
import { listProductPackages, listStagedFiles, stagedFileRecord } from './product-file-utils.mjs'
const dryRun = process.argv.includes('--dry-run')
const bucket = process.env.VARUNTOOLS_R2_BUCKET || ''
let uploads = 0
console.log(`R2 Publish ${dryRun ? '(dry-run)' : ''}`.trim())
for (const pkg of listProductPackages()) {
  for (const file of listStagedFiles(pkg.slug)) {
    const record = stagedFileRecord(pkg, file)
    uploads += 1
    console.log(`${dryRun ? '[dry-run]' : '[upload]'} ${file} -> ${record.r2Key}`)
    if (!dryRun) {
      if (!bucket) {
        console.error('ERROR VARUNTOOLS_R2_BUCKET is required for real upload.')
        process.exit(1)
      }
      const result = spawnSync('npx', ['wrangler', 'r2', 'object', 'put', `${bucket}/${record.r2Key}`, '--file', file], { stdio: 'inherit', shell: process.platform === 'win32' })
      if (result.status !== 0) process.exit(result.status ?? 1)
    }
  }
}
console.log(`[r2:publish] ${dryRun ? 'planned' : 'uploaded'} ${uploads} files`)
console.log('[r2:publish] manifest was not modified')
