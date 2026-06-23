#!/usr/bin/env node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const PATCH_ID = 'CMS-204AP'
const PASS_STATUS = 'PASS_CMS_204AP_LIVE_MATERIALIZED_MARKDOWN_REGISTRY_SOURCE_REBIND_IMPORT_GLOB_INCLUSION_SEAL'
const RECEIPT_PATH = 'artifacts/cms/CMS_204AP_LIVE_MATERIALIZED_MARKDOWN_REGISTRY_SOURCE_REBIND.json'

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
}

function includesAll(text, needles) {
  return needles.every((needle) => text.includes(needle))
}

function lineHasForcePush(line) {
  if (!/\bpush\b/.test(line)) return false
  return /--force(?:-with-lease)?\b|\s-f(?:\s|['"\]])/.test(line)
}

function noForcePush(...texts) {
  return texts.every((text) => text.split(/\r?\n/).every((line) => !lineHasForcePush(line)))
}

function noSecretLiteral(...texts) {
  return texts.every((text) => !/(ghp_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+|vt_admin_[A-Za-z0-9_]+)/.test(text))
}

function firstFalse(checks) {
  return Object.entries(checks).find(([, value]) => value !== true)?.[0] || null
}

function run(command, args, cwd = process.cwd()) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', shell: process.platform === 'win32' })
  return { ok: result.status === 0, stdout: result.stdout || '', stderr: result.stderr || '' }
}

function runFixture(builderText, loadPagesText, generatedModuleText) {
  if (!builderText.includes('vacmsLiveMarkdownPageSources') && !builderText.includes('vacms-live-markdown-registry-source-rebind.json')) return false
  if (!loadPagesText.includes('vacmsLiveMarkdownPageSources')) return false
  if (!generatedModuleText.includes('vacmsLiveMarkdownPageSources: VacmsLiveMarkdownPageSource[] = []')) return false
  const res = run('node', ['scripts/build-vacms-live-markdown-registry.mjs', '--fixture'])
  return res.ok === true && res.stdout.includes('PASS_CMS_204AP_LIVE_MATERIALIZED_MARKDOWN_REGISTRY_SOURCE_REBIND_SOURCE_WRITTEN')
}

function main() {
  const workflowPath = '.github/workflows/publish-admin-content.yml'
  const loadPagesPath = 'src/markdown/loadMarkdownPages.ts'
  const generatedModulePath = 'src/markdown/vacmsLivePages.generated.ts'
  const builderPath = 'scripts/build-vacms-live-markdown-registry.mjs'
  const guardPath = 'scripts/cms-204ap-live-materialized-markdown-registry-source-rebind-guard.mjs'
  const aoGuardPath = 'scripts/cms-204ao-markdown-page-registry-inclusion-guard.mjs'
  const deployPath = 'scripts/deploy-pages-branch.mjs'

  const workflow = read(workflowPath)
  const loadPages = read(loadPagesPath)
  const generatedModule = read(generatedModulePath)
  const builder = read(builderPath)
  const guard = read(guardPath)
  const aoGuard = read(aoGuardPath)
  const deploy = read(deployPath)

  const materializeIndex = workflow.indexOf('- name: Materialize content file')
  const registryIndex = workflow.indexOf('- name: Build VACMS live markdown registry source')
  const setupIndex = workflow.indexOf('- name: Setup Node for live branch apply')
  const buildIndex = workflow.indexOf('- name: Validate and build live branch apply content')
  const aoIndex = workflow.indexOf('- name: Verify live materialized markdown page registry')
  const deployIndex = workflow.indexOf('- name: Deploy live public site branch')

  const checks = {
    workflow_exists: fs.existsSync(workflowPath),
    registry_source_step_exists: workflow.includes('- name: Build VACMS live markdown registry source'),
    registry_source_step_after_materialize_before_build: materializeIndex >= 0 && registryIndex > materializeIndex && (setupIndex < 0 || registryIndex < setupIndex) && (buildIndex < 0 || registryIndex < buildIndex),
    registry_source_step_live_only: workflow.includes("if: ${{ inputs.publish_mode == 'cms-live-branch-apply' }}") && workflow.includes('node scripts/build-vacms-live-markdown-registry.mjs --workflow'),
    registry_builder_script_exists: fs.existsSync(builderPath),
    registry_builder_reads_materialization_receipt: builder.includes('vacms-materialization-receipt.json'),
    registry_builder_reads_generated_markdown: builder.includes('fs.readFileSync(generatedPath'),
    registry_builder_writes_generated_ts_module: builder.includes('src/markdown/vacmsLivePages.generated.ts') && builder.includes('vacmsLiveMarkdownPageSources'),
    registry_builder_writes_runtime_receipt: builder.includes('vacms-live-markdown-registry-source-rebind.json'),
    generated_module_exists: fs.existsSync(generatedModulePath),
    generated_module_default_empty_array: generatedModule.includes('vacmsLiveMarkdownPageSources: VacmsLiveMarkdownPageSource[] = []'),
    load_markdown_pages_imports_generated_module: loadPages.includes("import { vacmsLiveMarkdownPageSources } from './vacmsLivePages.generated'"),
    load_markdown_pages_merges_glob_and_live_sources: includesAll(loadPages, ['const globPages', 'const livePages', 'for (const page of globPages)', 'for (const page of livePages)', 'return [...merged.values()]']),
    live_source_overrides_same_content_dir: loadPages.indexOf('for (const page of livePages)') > loadPages.indexOf('for (const page of globPages)') && loadPages.includes('merged.set(page.contentDir, page)'),
    cms204ao_post_build_registry_guard_preserved: aoGuard.includes('CMS-204AO') && workflow.includes('Verify live materialized markdown page registry') && aoIndex > buildIndex && aoIndex < deployIndex,
    cms204al_finalize_gate_preserved: workflow.includes('CMS-204AL live deploy push evidence is missing or pushed is not true') && workflow.includes('commitSha: deploySha'),
    cms204am_rebase_gate_preserved: deploy.includes('cms-204am-remote-deploy-ref-rebase@1') && deploy.includes('origin/${DEPLOY_BRANCH}') && deploy.includes('remoteBaseSha'),
    cms204an_slug_alignment_preserved: workflow.includes('materializedSlug') && workflow.includes('slugSource') && workflow.includes('vacmsSlug'),
    no_force_push: noForcePush(workflow, deploy, builder, guard, aoGuard),
    no_dist_manual_patch: !builder.includes('dist/assets') && !builder.includes('dist/index.html') && !loadPages.includes('dist/assets'),
    no_vacms_worker_mutation: !workflow.includes('wrangler d1 execute') && !workflow.includes('workers/admin-api'),
    no_secret_literal_detected: noSecretLiteral(workflow, loadPages, generatedModule, builder, guard, deploy, aoGuard),
    fixture_live_registry_source_positive_passes: runFixture(builder, loadPages, generatedModule),
    fixture_empty_default_module_passes: generatedModule.trim().endsWith('export const vacmsLiveMarkdownPageSources: VacmsLiveMarkdownPageSource[] = []'),
    artifact_includes_live_registry_receipt: workflow.includes('vacms-live-markdown-registry-source-rebind.json'),
    artifact_includes_page_registry_receipt: workflow.includes('vacms-page-registry-receipt.json'),
  }

  const blocked = firstFalse(checks)
  const pass = !blocked
  const receipt = {
    patch_id: PATCH_ID,
    status: pass ? PASS_STATUS : `FAIL_${PASS_STATUS}`,
    pass,
    blocked_reason_code: blocked ? `BLOCKED_${blocked.toUpperCase()}` : null,
    blocked_reason: blocked ? `${blocked} was not satisfied` : null,
    checks,
    registry_source_policy: {
      globRemainsPrimary: true,
      liveGeneratedRegistrySupplementsGlob: true,
      liveRegistryOverridesSameContentDir: true,
      distManualPatchAllowed: false,
      deployBlockedIfPostBuildRegistryMissing: true,
      example: {
        generatedPath: 'src/content/pages/page/sdsdsd/index.md',
        materializedSlug: 'page/sdsdsd',
        registryModule: 'src/markdown/vacmsLivePages.generated.ts',
      },
    },
    generatedAt: new Date().toISOString(),
  }

  fs.mkdirSync(path.dirname(RECEIPT_PATH), { recursive: true })
  fs.writeFileSync(RECEIPT_PATH, JSON.stringify(receipt, null, 2))
  console.log(receipt.status)
  if (!pass) {
    console.error(receipt.blocked_reason)
    process.exit(1)
  }
}

main()
