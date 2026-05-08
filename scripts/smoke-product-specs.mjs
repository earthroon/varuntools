#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import process from 'node:process'
function fail(message) { console.error(`[smoke:product-specs] FAIL ${message}`); process.exit(1) }
function read(file) { if (!existsSync(file)) fail(`missing ${file}`); return readFileSync(file, 'utf8') }
for (const file of ['src/components/markdown/ProductSpecBlocks.vue','src/utils/productSpecs.ts','src/markdown/directives/productSpecsDirective.ts','src/content/pages/products/spec-playground/index.md','docs/authoring/product-specs.md','docs/migration/commit-65.md']) read(file)
const directiveTypes = read('src/markdown/directiveTypes.ts')
if (!directiveTypes.includes("'product-specs'")) fail('directiveTypes missing product-specs')
const directives = read('src/markdown/directives/index.ts')
if (!directives.includes('renderProductSpecsDirective')) fail('directive index missing product specs renderer')
const mount = read('src/markdown/mountMarkdownComponents.ts')
if (!mount.includes('ProductSpecBlocks') || !mount.includes("querySelectorAll('product-specs')")) fail('mountMarkdownComponents missing product specs mount')
const page = read('src/content/pages/products/spec-playground/index.md')
for (const token of ['::product-specs','specs:','variants:','includedItems:','delivery:','status: coming-soon']) if (!page.includes(token)) fail(`spec playground missing ${token}`)
const pkg = JSON.parse(read('package.json'))
if (pkg.scripts?.['smoke:product-specs'] !== 'node scripts/smoke-product-specs.mjs') fail('package.json missing smoke:product-specs')
const check = read('scripts/check-launch.mjs')
if (!check.includes('scripts/smoke-product-specs.mjs')) fail('check-launch missing smoke:product-specs')
console.log('[smoke:product-specs] OK product specs component, directive, playground, and launch wiring are present')
