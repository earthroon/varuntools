
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'

export const root = process.cwd()
export const productsRoot = path.join(root, 'src/content/pages/products')
export const stagingRoot = path.join(root, '_private/product-files')
export const artifactRoot = path.join(root, 'artifacts/r2')
export const skipProductDirs = new Set(['categories'])

export function rel(file) { return path.relative(root, file).replaceAll(path.sep, '/') }
export function readJson(file) { return JSON.parse(readFileSync(file, 'utf8')) }
export function writeJson(file, data) { writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`) }
export function ensureDir(dir) { mkdirSync(dir, { recursive: true }) }

export function listProductPackages() {
  if (!existsSync(productsRoot)) return []
  return readdirSync(productsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !skipProductDirs.has(entry.name))
    .map((entry) => {
      const dir = path.join(productsRoot, entry.name)
      const manifestPath = path.join(dir, 'product.manifest.json')
      if (!existsSync(manifestPath)) return null
      return { slug: entry.name, dir, manifestPath, manifest: readJson(manifestPath) }
    })
    .filter(Boolean)
    .sort((a, b) => a.slug.localeCompare(b.slug))
}

export function listStagedFiles(slug) {
  const dir = path.join(stagingRoot, slug)
  if (!existsSync(dir)) return []
  const out = []
  function walk(current) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const file = path.join(current, entry.name)
      if (entry.isDirectory()) walk(file)
      else if (entry.isFile() && !entry.name.startsWith('.')) out.push(file)
    }
  }
  walk(dir)
  return out.sort()
}

export function sha256File(file) {
  const hash = createHash('sha256')
  hash.update(readFileSync(file))
  return hash.digest('hex')
}

export function contentTypeFor(file) {
  const ext = path.extname(file).toLowerCase()
  if (ext === '.zip') return 'application/zip'
  if (ext === '.pdf') return 'application/pdf'
  if (ext === '.png') return 'image/png'
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.webp') return 'image/webp'
  if (ext === '.json') return 'application/json'
  if (ext === '.md' || ext === '.txt') return 'text/plain; charset=utf-8'
  return 'application/octet-stream'
}

export function kebabId(file) {
  return path.basename(file, path.extname(file)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'file'
}

export function r2KeyFor(pkg, file) {
  const prefix = pkg.manifest.delivery?.r2?.keyPrefix || `products/${pkg.slug}/`
  const stagedBase = path.join(stagingRoot, pkg.slug)
  const relative = path.relative(stagedBase, file).replaceAll(path.sep, '/')
  return `${prefix.replace(/\/+$/, '')}/${relative}`
}

export function stagedFileRecord(pkg, file) {
  const stat = statSync(file)
  return {
    id: kebabId(file),
    label: path.basename(file),
    fileName: path.basename(file),
    contentType: contentTypeFor(file),
    sizeBytes: stat.size,
    sha256: sha256File(file),
    r2Key: r2KeyFor(pkg, file),
  }
}
