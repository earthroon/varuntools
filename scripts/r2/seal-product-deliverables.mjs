#!/usr/bin/env node
import { listProductPackages, listStagedFiles, stagedFileRecord, writeJson } from './product-file-utils.mjs'
let sealedProducts = 0
const now = new Date().toISOString()
for (const pkg of listProductPackages()) {
  const files = listStagedFiles(pkg.slug)
  if (!files.length) continue
  const deliverables = files.map((file) => ({ ...stagedFileRecord(pkg, file), uploadedAt: now, verifiedAt: null }))
  pkg.manifest.delivery = pkg.manifest.delivery || {}
  pkg.manifest.delivery.deliverables = deliverables
  pkg.manifest.delivery.sealedAt = now
  writeJson(pkg.manifestPath, pkg.manifest)
  sealedProducts += 1
  console.log(`[r2:seal] sealed ${pkg.slug} with ${deliverables.length} deliverables`)
}
console.log(`[r2:seal] sealed products: ${sealedProducts}`)
