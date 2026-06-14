#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
const root=process.cwd()
const required=[
  '_private/product-files/README.md',
  'scripts/r2/product-file-utils.mjs',
  'scripts/r2/plan-product-upload.mjs',
  'scripts/r2/publish-product-files.mjs',
  'scripts/r2/seal-product-deliverables.mjs',
  'scripts/r2/verify-product-deliverables.mjs',
  'docs/authoring/r2-product-upload.md',
]
const errors=[]
for (const rel of required) if (!existsSync(path.join(root,rel))) errors.push(`missing ${rel}`)
const pkg=JSON.parse(readFileSync(path.join(root,'package.json'),'utf8'))
for (const script of ['r2:plan','r2:publish:dry-run','r2:publish','r2:seal','r2:verify']) if (!pkg.scripts?.[script]) errors.push(`package.json missing ${script}`)
const ignore=readFileSync(path.join(root,'.gitignore'),'utf8')
if (!ignore.includes('_private/product-files/*')) errors.push('.gitignore must ignore private product files')
const publish=readFileSync(path.join(root,'scripts/r2/publish-product-files.mjs'),'utf8')
if (!publish.includes('manifest was not modified')) errors.push('publish script must explicitly not modify manifest')
if (errors.length) { for (const e of errors) console.error(`ERROR ${e}`); process.exit(1) }
console.log('[smoke:r2-upload] OK R2 upload tooling is wired')
