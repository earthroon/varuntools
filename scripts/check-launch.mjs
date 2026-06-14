#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import process from 'node:process'

const stepGroups = [
  {
    name: 'dependency-runtime',
    steps: [
      ['node', ['scripts/check-dependency-runtime.mjs'], 'check:deps'],
    ],
  },
  {
    name: 'content-authoring',
    steps: [
      ['node', ['scripts/validate-content.mjs'], 'validate:content'],
      ['node', ['scripts/smoke-home-featured-works.mjs'], 'smoke:home-featured-works'],
      ['node', ['scripts/smoke-works-collection.mjs'], 'smoke:works-collection'],
      ['node', ['scripts/smoke-portfolio-link-guard.mjs'], 'smoke:portfolio-link-guard'],
      ['node', ['scripts/smoke-portfolio-render-components.mjs'], 'smoke:portfolio-render-components'],
      ['node', ['scripts/smoke-portfolio-accessibility.mjs'], 'smoke:portfolio-accessibility'],
      ['node', ['scripts/smoke-ewa-gallery-processor.mjs'], 'smoke:ewa-gallery-processor'],
      ['node', ['scripts/smoke-ewa-webgpu-compute.mjs'], 'smoke:ewa-webgpu-compute'],
      ['node', ['scripts/smoke-ewa-visual-qa.mjs'], 'smoke:ewa-visual-qa'],
      ['node', ['scripts/smoke-ewa-adaptive-tile.mjs'], 'smoke:ewa-adaptive-tile'],
      ['node', ['scripts/smoke-ewa-color-presentation.mjs'], 'smoke:ewa-color-presentation'],
      ['node', ['scripts/smoke-ewa-authoring-metadata.mjs'], 'smoke:ewa-authoring-metadata'],
      ['node', ['scripts/smoke-ewa-quality-budget.mjs'], 'smoke:ewa-quality-budget'],
      ['node', ['scripts/smoke-ewa-runtime-health.mjs'], 'smoke:ewa-runtime-health'],
      ['node', ['scripts/smoke-ewa-rollout-gate.mjs'], 'smoke:ewa-rollout-gate'],
      ['node', ['scripts/smoke-ewa-fixture-gallery.mjs'], 'smoke:ewa-fixture-gallery'],
      ['node', ['scripts/smoke-inquiry-form.mjs'], 'smoke:inquiry-form'],
      ['node', ['scripts/smoke-inquiry-google-form.mjs'], 'smoke:inquiry-google-form'],
      ['node', ['scripts/smoke-inquiry-response-workflow.mjs'], 'smoke:inquiry-response-workflow'],
      ['node', ['scripts/smoke-inquiry-intake-contract.mjs'], 'smoke:inquiry-intake-contract'],
      ['node', ['scripts/smoke-inquiry-worker-api-contract.mjs'], 'smoke:inquiry-worker-api-contract'],
      ['node', ['scripts/smoke-inquiry-d1-storage.mjs'], 'smoke:inquiry-d1-storage'],
      ['node', ['scripts/smoke-admin-inquiry-queue.mjs'], 'smoke:admin-inquiry-queue'],
      ['node', ['scripts/smoke-inquiry-notification-workflow.mjs'], 'smoke:inquiry-notification-workflow'],
      ['node', ['scripts/smoke-inquiry-worker-first-intake.mjs'], 'smoke:inquiry-worker-first-intake'],
      ['node', ['scripts/smoke-portfolio-editorial-blocks.mjs'], 'smoke:portfolio-editorial-blocks'],
      ['node', ['scripts/smoke-portfolio-editorial-applied.mjs'], 'smoke:portfolio-editorial-applied'],
      ['node', ['scripts/smoke-portfolio-editorial-layout-qa.mjs'], 'smoke:portfolio-editorial-layout-qa'],
      ['node', ['scripts/smoke-portfolio-editorial-content-validation.mjs'], 'smoke:portfolio-editorial-content-validation'],
      ['node', ['scripts/smoke-portfolio-editorial-visual-qa.mjs'], 'smoke:portfolio-editorial-visual-qa'],
      ['node', ['scripts/smoke-portfolio-editorial-showcase.mjs'], 'smoke:portfolio-editorial-showcase'],
      ['node', ['scripts/smoke-portfolio-featured-copy-polish.mjs'], 'smoke:portfolio-featured-copy-polish'],
      ['node', ['scripts/smoke-content-page-inventory.mjs'], 'smoke:content-page-inventory'],
      ['node', ['scripts/smoke-content-page-inventory-clean.mjs'], 'smoke:content-page-inventory-clean'],
      ['node', ['scripts/smoke-navigation-page-index.mjs'], 'smoke:navigation-page-index'],
      ['node', ['scripts/smoke-navigation-ui-connection.mjs'], 'smoke:navigation-ui-connection'],
      ['node', ['scripts/smoke-work-taxonomy-filter.mjs'], 'smoke:work-taxonomy-filter'],
      ['node', ['scripts/smoke-sitemap-visibility-rules.mjs'], 'smoke:sitemap-visibility-rules'],
      ['node', ['scripts/smoke-search-index-visibility-rules.mjs'], 'smoke:search-index-visibility-rules'],
      ['node', ['scripts/generate-sitemap.mjs'], 'seo:generate-sitemap'],
      ['node', ['scripts/generate-robots.mjs'], 'seo:generate-robots'],
      ['node', ['scripts/smoke-sitemap-output.mjs'], 'smoke:sitemap-output'],
      ['node', ['scripts/smoke-robots-output.mjs'], 'smoke:robots-output'],
      ['node', ['scripts/smoke-portfolio-presets.mjs'], 'smoke:portfolio-presets'],
      ['node', ['scripts/smoke-portfolio-docs.mjs'], 'smoke:portfolio-docs'],
      ['node', ['scripts/smoke-portfolio-search.mjs'], 'smoke:portfolio-search'],
      ['node', ['scripts/smoke-csv-fixtures.mjs'], 'smoke:csv-fixtures'],
      ['node', ['scripts/smoke-csv-asset-guard.mjs'], 'smoke:csv-asset-guard'],
      ['node', ['scripts/smoke-csv-preview-diff.mjs'], 'smoke:csv-preview-diff'],
      ['node', ['scripts/smoke-portfolio-frontmatter.mjs'], 'smoke:portfolio-frontmatter'],
      ['node', ['scripts/smoke-csv-portfolio-blocks.mjs'], 'smoke:csv-portfolio-blocks'],
      ['node', ['scripts/smoke-csv-options.mjs'], 'smoke:csv-options'],
      ['node', ['scripts/smoke-csv-diagnostics.mjs'], 'smoke:csv-diagnostics'],
      ['node', ['scripts/smoke-csv-authoring.mjs'], 'smoke:csv-authoring'],
      ['node', ['scripts/csv-pages.mjs'], 'csv:pages'],
      ['node', ['scripts/build-portfolio-asset-manifest.mjs'], 'build:portfolio-assets'],
      ['node', ['scripts/smoke-portfolio-asset-manifest.mjs'], 'smoke:portfolio-asset-manifest'],
      ['node', ['scripts/build-page-search-index.mjs'], 'build:page-search'],
      ['node', ['scripts/generate-internal-docs-search-index.mjs'], 'search:generate-internal-docs-index'],
      ['node', ['scripts/smoke-page-search.mjs'], 'smoke:page-search'],
      ['node', ['scripts/smoke-page-search-public-visibility.mjs'], 'smoke:page-search-public-visibility'],
      ['node', ['scripts/smoke-page-search-index-boundary.mjs'], 'smoke:page-search-index-boundary'],
      ['node', ['scripts/smoke-route-seo-manifest.mjs'], 'smoke:route-seo-manifest'],
      ['node', ['scripts/build-portfolio-tags.mjs'], 'build:portfolio-tags'],
      ['node', ['scripts/smoke-portfolio-tags.mjs'], 'smoke:portfolio-tags'],
      ['node', ['scripts/build-portfolio-seo.mjs'], 'build:portfolio-seo'],
      ['node', ['scripts/smoke-portfolio-seo.mjs'], 'smoke:portfolio-seo'],
      ['node', ['scripts/check-portfolio-publish.mjs'], 'check:publish'],
      ['node', ['scripts/smoke-portfolio-publish-gate.mjs'], 'smoke:portfolio-publish-gate'],
    ],
  },
  {
    name: 'security-workers',
    steps: [
      ['node', ['scripts/smoke-admin-audit-log.mjs'], 'smoke:admin-audit-log'],
      ['npm', ['run', 'check:security-smoke'], 'check:security-smoke'],
      ['npm', ['run', 'admin-api:typecheck'], 'admin-api:typecheck'],
      ['npm', ['run', 'delivery:check'], 'delivery:check'],
    ],
  },
  {
    name: 'build-release',
    steps: [
      ['node', ['node_modules/vue-tsc/bin/vue-tsc.js', '--noEmit'], 'typecheck'],
      ['node', ['node_modules/vite/bin/vite.js', 'build'], 'vite:build'],
      ['node', ['scripts/create-spa-fallback.mjs'], 'create-spa-fallback'],
      ['node', ['scripts/generate-sitemap.mjs'], 'generate:sitemap'],
      ['node', ['scripts/smoke-seo.mjs'], 'smoke:seo'],
      ['node', ['scripts/audit-launch-readiness.mjs'], 'audit:launch-readiness'],
    ],
  },
]

const timeoutMs = Number(process.env.VT_CHECK_LAUNCH_STEP_TIMEOUT_MS || 120000)
const results = []

function run(command, args, label, group) {
  console.log(`[check:launch] RUN ${group}/${label}`)
  const started = Date.now()
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    timeout: timeoutMs,
  })
  const durationMs = Date.now() - started
  const status = result.error?.code === 'ETIMEDOUT' ? 'timeout' : result.status === 0 ? 'pass' : 'fail'
  results.push({ group, label, status, durationMs, code: result.status, error: result.error?.message || '' })

  if (status !== 'pass') {
    console.error(`[check:launch] ${status.toUpperCase()} ${group}/${label} (${durationMs}ms)`)
    return false
  }

  console.log(`[check:launch] PASS ${group}/${label} (${durationMs}ms)`)
  return true
}

let ok = true
for (const group of stepGroups) {
  console.log(`[check:launch] GROUP ${group.name}`)
  for (const [command, args, label] of group.steps) {
    if (!run(command, args, label, group.name)) {
      ok = false
      break
    }
  }
  if (!ok) break
}

const passed = results.filter((result) => result.status === 'pass').length
const failed = results.filter((result) => result.status === 'fail').length
const timedOut = results.filter((result) => result.status === 'timeout').length
console.log('[check:launch] summary')
console.log(`- passed: ${passed}`)
console.log(`- failed: ${failed}`)
console.log(`- timed out: ${timedOut}`)

if (!ok) {
  const last = results[results.length - 1]
  if (last) {
    console.error(`[check:launch] stopped at ${last.group}/${last.label}`)
    if (last.error) console.error(`[check:launch] error: ${last.error}`)
  }
  process.exit(1)
}

console.log('[check:launch] OK all launch checks passed')
