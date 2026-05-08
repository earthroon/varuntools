#!/usr/bin/env node
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import process from 'node:process'
import { screenshotOutputRoot, visualRoutes, visualViewports } from './visual-routes.mjs'

const root = process.cwd()
const args = new Set(process.argv.slice(2))
const rawArgs = process.argv.slice(2)
const headed = args.has('--headed')
const keepServer = args.has('--keep-server')
const dryRun = args.has('--dry-run')
const baseUrlArg = rawArgs.find((arg) => arg.startsWith('--base-url='))
const baseURL = baseUrlArg ? baseUrlArg.split('=').slice(1).join('=') : process.env.QA_BASE_URL || 'http://127.0.0.1:4173'
// Default output root: artifacts/qa/screenshots/current
const outputRoot = path.join(root, screenshotOutputRoot)

function normalizeUrl(url) {
  return url.replace(/\/$/, '')
}

function requestUrl(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume()
      resolve(res.statusCode && res.statusCode < 500)
    })
    req.setTimeout(1200, () => {
      req.destroy()
      resolve(false)
    })
    req.on('error', () => resolve(false))
  })
}

async function waitForServer(url, timeoutMs = 20_000) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    if (await requestUrl(url)) return true
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  return false
}

function startPreviewServer() {
  const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4173'], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
  })
  child.stdout.on('data', (chunk) => process.stdout.write(`[qa:screenshots:server] ${chunk}`))
  child.stderr.on('data', (chunk) => process.stderr.write(`[qa:screenshots:server] ${chunk}`))
  return child
}

async function importPlaywright() {
  try {
    return await import('playwright')
  } catch (error) {
    console.error('[qa:screenshots] Playwright is not installed in this environment.')
    console.error('[qa:screenshots] Run `npm install` and then `npx playwright install chromium`, or provide an environment where Playwright browsers are available.')
    console.error(`[qa:screenshots] Original error: ${error.message}`)
    process.exit(2)
  }
}

function getPlan() {
  return visualViewports.flatMap((viewport) =>
    visualRoutes.map((route) => ({ viewport, route })),
  )
}

if (dryRun) {
  console.log(`[qa:screenshots] dry run only. Output root: ${screenshotOutputRoot}`)
  for (const { viewport, route } of getPlan()) {
    console.log(`${viewport.name} ${route.path} -> ${screenshotOutputRoot}/${viewport.name}/${route.name}.png`)
  }
  process.exit(0)
}

let server = null
let ownsServer = false
const normalizedBaseURL = normalizeUrl(baseURL)
const serverAlreadyUp = await requestUrl(normalizedBaseURL)

if (!serverAlreadyUp) {
  if (baseUrlArg || process.env.QA_BASE_URL) {
    console.error(`[qa:screenshots] Base URL is not reachable: ${normalizedBaseURL}`)
    process.exit(1)
  }
  server = startPreviewServer()
  ownsServer = true
  const ready = await waitForServer(normalizedBaseURL)
  if (!ready) {
    console.error(`[qa:screenshots] Preview server did not become ready: ${normalizedBaseURL}`)
    if (server && !server.killed) server.kill('SIGTERM')
    process.exit(1)
  }
}

const { chromium } = await importPlaywright()
let browser = null
let failures = 0

try {
  browser = await chromium.launch({ headless: !headed })
  fs.rmSync(outputRoot, { recursive: true, force: true })
  fs.mkdirSync(outputRoot, { recursive: true })

  for (const viewport of visualViewports) {
    const viewportDir = path.join(outputRoot, viewport.name)
    fs.mkdirSync(viewportDir, { recursive: true })

    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      colorScheme: 'light',
      reducedMotion: 'reduce',
    })

    for (const route of visualRoutes) {
      const page = await context.newPage()
      const url = `${normalizedBaseURL}${route.path}`
      const outFile = path.join(viewportDir, `${route.name}.png`)
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 })
        await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined)
        await page.addStyleTag({ content: '* { scroll-behavior: auto !important; }' }).catch(() => undefined)
        await page.screenshot({ path: outFile, fullPage: true })
        console.log(`[qa:screenshots] captured ${viewport.name} ${route.path} -> ${path.relative(root, outFile)}`)
      } catch (error) {
        failures += 1
        console.error(`[qa:screenshots] failed ${viewport.name} ${route.path}: ${error.message}`)
      } finally {
        await page.close().catch(() => undefined)
      }
    }

    await context.close().catch(() => undefined)
  }
} catch (error) {
  console.error(`[qa:screenshots] Browser capture setup failed: ${error.message}`)
  console.error('[qa:screenshots] If Chromium is missing, run `npx playwright install chromium`.')
  if (ownsServer && server && !keepServer && !server.killed) server.kill('SIGTERM')
  process.exit(1)
} finally {
  if (browser) await browser.close().catch(() => undefined)
  if (ownsServer && server && !keepServer && !server.killed) server.kill('SIGTERM')
}

if (failures > 0) {
  console.error(`[qa:screenshots] FAILED with ${failures} capture failure(s)`)
  process.exit(1)
}

console.log(`[qa:screenshots] OK captured ${visualRoutes.length * visualViewports.length} screenshots into ${screenshotOutputRoot}`)
