#!/usr/bin/env node
import fs from 'node:fs'
import { spawnSync } from 'node:child_process'
import process from 'node:process'

const PASS_STATUS = 'PASS_CMS_207D_GH_PAGES_STATIC_ARTICLE_READBACK'
const RECEIPT_FILE = 'static-route-materialization-receipt.json'

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: options.encoding ?? 'utf8',
    stdio: options.stdio ?? 'pipe',
    shell: process.platform === 'win32',
    ...options,
  })
  if (result.status !== 0) {
    const detail = [result.stdout, result.stderr].filter(Boolean).join('\n').trim()
    throw new Error(`command failed: ${command} ${args.join(' ')}${detail ? `\n${detail}` : ''}`)
  }
  return result.stdout?.trim?.() ?? ''
}

function trimSlashes(value) {
  return String(value || '').replace(/\\/g, '/').replace(/^\/+|\/+$/g, '')
}

function main() {
  if (!fs.existsSync(RECEIPT_FILE)) throw new Error(RECEIPT_FILE + ' is missing')
  const receipt = JSON.parse(fs.readFileSync(RECEIPT_FILE, 'utf8'))
  const routePath = receipt.routePath || receipt.expectedRoute?.routePath
  const staticRoutePath = trimSlashes(receipt.staticRoutePath || receipt.expectedRoute?.staticRoutePath || (routePath ? trimSlashes(routePath) + '/index.html' : ''))
  if (!staticRoutePath) throw new Error('staticRoutePath is missing')
  run('git', ['fetch', 'origin', 'gh-pages'])
  run('git', ['cat-file', '-e', `origin/gh-pages:${staticRoutePath}`])
  const html = run('git', ['show', `origin/gh-pages:${staticRoutePath}`])
  if (!html.includes('data-vacms-static-article="true"')) throw new Error('static article marker missing from gh-pages: ' + staticRoutePath)
  if (!html.includes('data-vacms-static-prerender="true"')) throw new Error('static prerender marker missing from gh-pages: ' + staticRoutePath)
  if (/<div\s+id=["']app["']\s*>\s*<\/div>/i.test(html)) throw new Error('empty app shell remains in gh-pages: ' + staticRoutePath)
  if (/(^|\n)\s*:{2,3}\s*[a-zA-Z0-9_-]+/.test(html)) throw new Error('raw markdown directive leaked in gh-pages: ' + staticRoutePath)
  console.log(PASS_STATUS)
  console.log('staticRoutePath=' + staticRoutePath)
}

main()
