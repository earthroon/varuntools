#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const objectLeakToken = '[' + 'object Object' + ']'
const SITE_BASE_URL = (process.env.SITE_BASE_URL || 'https://varun.tools').replace(/\/$/, '')

function fullPath(relativePath) {
  return path.join(root, relativePath)
}

function ensureDir(relativePath) {
  fs.mkdirSync(fullPath(relativePath), { recursive: true })
}

const disallowRules = [
  '/checkout/',
  '/qa/',
  '/works/editorial-showcase',
  '/products/dummy-catalog',
  '/products/spec-playground',
  '/claim',
]

const robots = [
  'User-agent: *',
  'Allow: /',
  '',
  ...disallowRules.map((rule) => `Disallow: ${rule}`),
  '',
  `Sitemap: ${SITE_BASE_URL}/sitemap.xml`,
  '',
].join('\n')

if (robots.includes(objectLeakToken)) throw new Error('Object serialization leak detected in robots output.')

ensureDir('generated')
ensureDir('public')
fs.writeFileSync(fullPath('generated/robots.txt'), robots)
fs.writeFileSync(fullPath('public/robots.txt'), robots)

console.log('[robots] wrote generated/robots.txt')
console.log('[robots] mirrored output to public/robots.txt for existing SEO smoke')
