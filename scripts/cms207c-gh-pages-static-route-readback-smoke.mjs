#!/usr/bin/env node
import fs from 'node:fs'
import { spawnSync } from 'node:child_process'
import process from 'node:process'

const PASS_STATUS = 'PASS_CMS_207C_GH_PAGES_STATIC_ROUTE_READBACK'
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
    const error = new Error(`command failed: ${command} ${args.join(' ')}${detail ? `\n${detail}` : ''}`)
    error.exitCode = result.status
    throw error
  }
  return result.stdout?.trim?.() ?? ''
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function normalizeSlash(value) {
  return String(value || '').replace(/\\/g, '/')
}

function trimSlashes(value) {
  return normalizeSlash(value).replace(/^\/+|\/+$/g, '')
}

function main() {
  if (!fs.existsSync(RECEIPT_FILE)) throw new Error(RECEIPT_FILE + ' is missing')
  const receipt = readJson(RECEIPT_FILE)
  const routePath = receipt.routePath || receipt.expectedRoute?.routePath
  const staticRoutePath = trimSlashes(receipt.staticRoutePath || receipt.expectedRoute?.staticRoutePath || (routePath ? trimSlashes(routePath) + '/index.html' : ''))
  if (!routePath || !staticRoutePath) throw new Error('static route receipt routePath/staticRoutePath is missing')

  run('git', ['fetch', 'origin', 'gh-pages'])
  run('git', ['cat-file', '-e', `origin/gh-pages:${staticRoutePath}`])
  const html = run('git', ['show', `origin/gh-pages:${staticRoutePath}`])
  const marker = `name="vacms-static-route" content="/${trimSlashes(routePath)}"`
  if (!html.includes(marker)) throw new Error('origin/gh-pages static route marker missing: ' + marker)

  console.log(PASS_STATUS)
  console.log('staticRoutePath=' + staticRoutePath)
}

main()
