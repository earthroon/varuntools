import fs from 'node:fs/promises'
import path from 'node:path'

const PATCH_ID = 'CMS-208J'
const distRoot = 'dist'
const indexHtmlPath = path.join(distRoot, 'index.html')

const routeRoots = [
  {
    sourceRoot: path.join('src', 'content', 'pages', 'page'),
    publicRoot: 'page',
  },
  {
    sourceRoot: path.join('src', 'content', 'pages', 'post'),
    publicRoot: 'post',
  },
]

async function exists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function readDirs(root) {
  if (!(await exists(root))) return []

  const entries = await fs.readdir(root, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith('.'))
    .sort()
}

async function writeShellRoute(targetPath, html) {
  await fs.mkdir(path.dirname(targetPath), { recursive: true })
  await fs.writeFile(targetPath, html, 'utf8')
}

if (!(await exists(indexHtmlPath))) {
  throw new Error(`${PATCH_ID}_DIST_INDEX_MISSING: run vite build before materializing dynamic routes`)
}

const html = await fs.readFile(indexHtmlPath, 'utf8')
const materialized = []

for (const routeRoot of routeRoots) {
  const slugs = await readDirs(routeRoot.sourceRoot)

  for (const slug of slugs) {
    const sourceIndex = path.join(routeRoot.sourceRoot, slug, 'index.md')
    if (!(await exists(sourceIndex))) continue

    const directoryRoute = path.join(distRoot, routeRoot.publicRoot, slug, 'index.html')
    const htmlRoute = path.join(distRoot, routeRoot.publicRoot, `${slug}.html`)

    await writeShellRoute(directoryRoute, html)
    await writeShellRoute(htmlRoute, html)

    materialized.push(`/${routeRoot.publicRoot}/${slug}/`)
    materialized.push(`/${routeRoot.publicRoot}/${slug}.html`)
  }
}

const receipt = {
  patchId: PATCH_ID,
  status: 'PASS',
  routeCount: materialized.length,
  routes: materialized,
  generatedAt: new Date().toISOString(),
}

await fs.writeFile(
  path.join(distRoot, 'dynamic-content-routes-receipt.json'),
  JSON.stringify(receipt, null, 2),
  'utf8',
)

console.log(`PASS_${PATCH_ID}_DYNAMIC_CONTENT_ROUTE_MATERIALIZATION`)
console.log(`routeCount=${materialized.length}`)
