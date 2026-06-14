#!/usr/bin/env node
import { existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { artifactRoot, ensureDir, listProductPackages, listStagedFiles, rel, stagedFileRecord, writeJson } from './product-file-utils.mjs'

const packages = listProductPackages()
const plan = { generatedAt: new Date().toISOString(), products: [], warnings: [], errors: [] }
for (const pkg of packages) {
  const files = listStagedFiles(pkg.slug)
  const delivery = pkg.manifest.delivery || {}
  const provider = delivery.provider
  const isDemo = Boolean(pkg.manifest.isDemo)
  const records = files.map((file) => stagedFileRecord(pkg, file))
  if (provider === 'cloudflare-r2' && files.length === 0) {
    plan.warnings.push({ code: isDemo ? 'demo-product-no-files' : 'product-no-staged-files', slug: pkg.slug, message: `${pkg.slug} has no staged files under _private/product-files/${pkg.slug}/.` })
  }
  plan.products.push({ slug: pkg.slug, isDemo, provider, keyPrefix: delivery.r2?.keyPrefix || `products/${pkg.slug}/`, stagedFileCount: files.length, files: records.map(({ id, fileName, sizeBytes, sha256, r2Key }) => ({ id, fileName, sizeBytes, sha256, r2Key })) })
}
ensureDir(artifactRoot)
const out = path.join(artifactRoot, 'upload-plan.json')
writeJson(out, plan)
console.log(`R2 Upload Plan`)
console.log(`products: ${plan.products.length}`)
console.log(`warnings: ${plan.warnings.length}`)
console.log(`errors: ${plan.errors.length}`)
console.log(`[r2:plan] wrote ${rel(out)}`)
for (const warning of plan.warnings) console.warn(`WARN [${warning.code}] ${warning.message}`)
if (plan.errors.length) process.exit(1)
