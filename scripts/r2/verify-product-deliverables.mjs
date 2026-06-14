#!/usr/bin/env node
import process from 'node:process'
import { listProductPackages, listStagedFiles, stagedFileRecord } from './product-file-utils.mjs'
const errors=[]
const warnings=[]
for (const pkg of listProductPackages()) {
  const staged = new Map(listStagedFiles(pkg.slug).map((file) => [stagedFileRecord(pkg,file).r2Key, stagedFileRecord(pkg,file)]))
  const deliverables = Array.isArray(pkg.manifest.delivery?.deliverables) ? pkg.manifest.delivery.deliverables : []
  if (!deliverables.length) {
    warnings.push({ code: pkg.manifest.isDemo ? 'demo-no-sealed-deliverables' : 'no-sealed-deliverables', message: `${pkg.slug} has no sealed deliverables.` })
    continue
  }
  for (const item of deliverables) {
    if (!item.r2Key) errors.push({ code:'deliverable-r2-key-missing', message:`${pkg.slug}/${item.id} has no r2Key.` })
    const local = staged.get(item.r2Key)
    if (local) {
      if (item.sha256 && item.sha256 !== local.sha256) errors.push({ code:'sha256-mismatch', message:`${pkg.slug}/${item.id} sha256 differs from staged file.` })
      if (Number(item.sizeBytes) !== Number(local.sizeBytes)) errors.push({ code:'size-mismatch', message:`${pkg.slug}/${item.id} size differs from staged file.` })
    } else {
      warnings.push({ code:'staged-file-not-present', message:`${pkg.slug}/${item.id} sealed deliverable has no local staged file for verification.` })
    }
  }
}
console.log('R2 Deliverable Verify')
console.log(`errors: ${errors.length}`)
console.log(`warnings: ${warnings.length}`)
for (const e of errors) console.error(`ERROR [${e.code}] ${e.message}`)
for (const w of warnings) console.warn(`WARN  [${w.code}] ${w.message}`)
if (errors.length) process.exit(1)
console.log('[r2:verify] OK deliverable metadata is internally consistent')
