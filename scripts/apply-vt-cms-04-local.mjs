#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const projectRoot = process.cwd()

function mustExist(relativePath) {
  const target = path.resolve(projectRoot, relativePath)
  if (!fs.existsSync(target)) throw new Error(relativePath + ' missing. Extract the VT-CMS-04 overlay into the repo root first.')
}

function readJson(relativePath) {
  const target = path.resolve(projectRoot, relativePath)
  if (!fs.existsSync(target)) return {}
  return JSON.parse(fs.readFileSync(target, 'utf8'))
}

function writeJson(relativePath, value) {
  const target = path.resolve(projectRoot, relativePath)
  fs.writeFileSync(target, JSON.stringify(value, null, 2) + '\n', 'utf8')
}

mustExist('scripts/fixtures/cms-image-sequence-page.md')
mustExist('scripts/smoke-cms-image-sequence-e2e-render.mjs')
mustExist('scripts/smoke-cms-image-sequence-static-build.mjs')

const packageJson = readJson('package.json')
packageJson.scripts = packageJson.scripts || {}
packageJson.scripts['smoke:cms-image-sequence-e2e'] = 'node scripts/smoke-cms-image-sequence-e2e-render.mjs'
packageJson.scripts['smoke:cms-image-sequence-static'] = 'node scripts/smoke-cms-image-sequence-static-build.mjs'
writeJson('package.json', packageJson)

console.log('PASS_VT_CMS_04_APPLY_OVERLAY')
