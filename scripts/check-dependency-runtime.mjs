#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const packagePath = path.join(root, 'package.json')
const lockPath = path.join(root, 'package-lock.json')
const requiredPackageDeps = ['gray-matter', 'markdown-it', 'vue', 'vue-router']
const requiredPackageDevDeps = ['vite', 'vue-tsc', 'typescript']
const requiredNodeModules = ['gray-matter', 'markdown-it', 'vue', 'vue-router', 'vite', 'vue-tsc']
const errors = []
const warnings = []

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch (error) {
    errors.push(`${path.relative(root, file)} is missing or invalid JSON: ${error.message}`)
    return null
  }
}

const pkg = readJson(packagePath)
const lock = existsSync(lockPath) ? readJson(lockPath) : null
if (!existsSync(lockPath)) errors.push('package-lock.json is required for dependency-backed launch verification.')

if (pkg) {
  const deps = pkg.dependencies || {}
  const devDeps = pkg.devDependencies || {}
  for (const name of requiredPackageDeps) {
    if (!deps[name]) errors.push(`package.json dependencies.${name} is required.`)
  }
  for (const name of requiredPackageDevDeps) {
    if (!devDeps[name]) errors.push(`package.json devDependencies.${name} is required.`)
  }
  for (const script of ['validate:content', 'check:launch', 'admin-api:typecheck', 'delivery:check']) {
    if (!pkg.scripts?.[script]) errors.push(`package.json scripts.${script} is required.`)
  }
}

if (lock?.packages) {
  for (const name of [...requiredPackageDeps, ...requiredPackageDevDeps]) {
    if (!lock.packages[`node_modules/${name}`]) errors.push(`package-lock.json does not include node_modules/${name}.`)
  }
}

for (const name of requiredNodeModules) {
  if (!existsSync(path.join(root, 'node_modules', name))) {
    errors.push(`node_modules/${name} is missing. Run npm ci before npm run check:launch.`)
  }
}

for (const file of [
  'node_modules/vite/bin/vite.js',
  'node_modules/vue-tsc/bin/vue-tsc.js',
]) {
  if (!existsSync(path.join(root, file))) errors.push(`${file} is missing.`)
}

if (!existsSync(path.join(root, 'workers', 'admin-api', 'node_modules'))) {
  warnings.push('workers/admin-api/node_modules is missing. admin-api:typecheck may need npm --prefix workers/admin-api ci.')
}
if (!existsSync(path.join(root, 'workers', 'delivery', 'node_modules'))) {
  warnings.push('workers/delivery/node_modules is missing. delivery:check may need npm --prefix workers/delivery ci.')
}

for (const warning of warnings) console.warn(`[check:deps] WARN ${warning}`)
if (errors.length) {
  console.error('[check:deps] FAILED dependency-backed runtime is not ready')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log('[check:deps] OK dependency-backed runtime is ready')
