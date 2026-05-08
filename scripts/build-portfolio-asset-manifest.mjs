#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { buildPortfolioAssetManifest, findPortfolioCsvFiles } from './lib/portfolio-asset-manifest.mjs'

const projectRoot = process.cwd()
const outputPath = path.resolve(projectRoot, 'src/content/generated/portfolio-asset-manifest.json')
const csvPaths = findPortfolioCsvFiles({ projectRoot })
const manifest = buildPortfolioAssetManifest({ projectRoot, csvPaths })

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

console.log('[build:portfolio-assets] wrote src/content/generated/portfolio-asset-manifest.json')
console.log(`[build:portfolio-assets] assets: ${manifest.summary.total}`)
console.log(`[build:portfolio-assets] missing: ${manifest.summary.missing}`)
console.log(`[build:portfolio-assets] large: ${manifest.summary.large}`)
