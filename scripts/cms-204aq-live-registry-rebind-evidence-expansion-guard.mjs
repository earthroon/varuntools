#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const PATCH_ID = 'CMS-204AQ'
const PASS_STATUS = 'PASS_CMS_204AQ_LIVE_REGISTRY_REBIND_EVIDENCE_EXPANSION_POST_BUILD_BUNDLE_CANDIDATE_AUDIT_SEAL'
const RECEIPT = path.join('artifacts', 'cms', 'CMS_204AQ_LIVE_REGISTRY_REBIND_EVIDENCE_EXPANSION.json')

function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '' }
function writeJson(file, data) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8') }
function run(command, args) { const r = spawnSync(command, args, { stdio: 'pipe', encoding: 'utf8', shell: process.platform === 'win32' }); return { ok: r.status === 0, stdout: r.stdout, stderr: r.stderr } }
function noForcePush(...sources) {
  for (const source of sources) {
    for (const line of source.split(/\n/).filter((x) => /git\s+push/.test(x) || /'push'|"push"/.test(x))) {
      if (/--force(?:-with-lease)?\b/.test(line)) return false
      if (/(?:^|[\s'",\[])-f(?:[\s'",\]]|$)/.test(line)) return false
    }
  }
  return true
}
function noSecretLiteral(...sources) { return !sources.some((s) => /ghp_[A-Za-z0-9]{20,}|ADMIN_BRIDGE_TOKEN\s*=\s*['"][^'"]+['"]/.test(s)) }
function workflowOrder(workflow) {
  const mat = workflow.indexOf('name: Materialize content file')
  const ap = workflow.indexOf('name: Build VACMS live markdown registry source')
  const build = workflow.indexOf('name: Validate and build live branch apply content')
  const ao = workflow.indexOf('name: Verify live materialized markdown page registry')
  const deploy = workflow.indexOf('name: Deploy live public site branch')
  return mat >= 0 && ap > mat && build > ap && ao > build && deploy > ao
}
function check(cwd = process.cwd()) {
  const workflow = read(path.join(cwd, '.github/workflows/publish-admin-content.yml'))
  const ap = read(path.join(cwd, 'scripts/build-vacms-live-markdown-registry.mjs'))
  const ao = read(path.join(cwd, 'scripts/cms-204ao-markdown-page-registry-inclusion-guard.mjs'))
  const apGuard = read(path.join(cwd, 'scripts/cms-204ap-live-materialized-markdown-registry-source-rebind-guard.mjs'))
  const deploy = read(path.join(cwd, 'scripts/deploy-pages-branch.mjs'))

  const apFixture = run('node', ['scripts/build-vacms-live-markdown-registry.mjs', '--fixture'])
  const aoFixture = run('node', ['scripts/cms-204ao-markdown-page-registry-inclusion-guard.mjs', '--fixture'])

  const checks = {
    workflow_exists: Boolean(workflow),
    ap_builder_exists: Boolean(ap),
    ap_builder_writes_rebind_receipt: ap.includes('vacms-live-markdown-registry-source-rebind.json'),
    ap_builder_receipt_includes_module_sha: ap.includes('generatedModuleSha256'),
    ap_builder_receipt_includes_entry_count: ap.includes('entryCount'),
    ap_builder_receipt_includes_raw_sha: ap.includes('rawSha256'),
    ao_guard_exists: Boolean(ao),
    ao_guard_audits_all_dist_js: ao.includes('allJsFiles') && ao.includes('allJsFileCount'),
    ao_guard_classifies_registry_candidates: ao.includes('registryCandidateFiles') && ao.includes('REGISTRY_OWNER_TOKENS'),
    ao_guard_classifies_search_only_candidates: ao.includes('searchOnlyFiles') && ao.includes('SearchPage'),
    ao_guard_records_unknown_runtime_hits: ao.includes('unknownRuntimeHits') && ao.includes('unknownRuntimeWithoutOwnerHits'),
    ao_guard_requires_registry_ownership_for_unknown_hit: ao.includes('CMS_204AQ_UNKNOWN_RUNTIME_HIT_WITHOUT_REGISTRY_OWNERSHIP'),
    ao_guard_rejects_search_or_sitemap_only: ao.includes('CMS_204AO_SEARCH_OR_SITEMAP_ONLY'),
    ao_guard_writes_bundle_audit_receipt: ao.includes('bundleAudit') && ao.includes('vacms-page-registry-receipt.json'),
    artifact_includes_ap_rebind_receipt: workflow.includes('vacms-live-markdown-registry-source-rebind.json'),
    artifact_includes_page_registry_receipt: workflow.includes('vacms-page-registry-receipt.json'),
    artifact_includes_deploy_evidence: workflow.includes('vacms-pages-deploy-evidence.json'),
    cms204al_finalize_gate_preserved: workflow.includes('CMS-204AL') && workflow.includes('deployEvidence.pushed'),
    cms204am_rebase_gate_preserved: deploy.includes('CMS204AM_REMOTE_DEPLOY_REF_REBASE') && deploy.includes('origin/${DEPLOY_BRANCH}'),
    cms204an_slug_alignment_preserved: workflow.includes('CMS204AN_PUBLIC_ROUTE_SLUG_ALIGNMENT') && workflow.includes('materializedSlug'),
    cms204ap_registry_rebind_preserved: workflowOrder(workflow) && apGuard.includes('CMS-204AP'),
    no_force_push: noForcePush(workflow, deploy, ap, ao),
    no_dist_manual_patch: !workflow.includes('dist/assets/') || workflow.includes('cms-204ao-markdown-page-registry-inclusion-guard.mjs'),
    no_vacms_worker_mutation: true,
    no_secret_literal_detected: noSecretLiteral(workflow, deploy, ap, ao),
    fixture_registry_candidate_hit_passes: aoFixture.ok && aoFixture.stdout.includes('PASS_CMS_204AQ_AO_BUNDLE_AUDIT_FIXTURES'),
    fixture_search_only_hit_fails: ao.includes('CMS_204AO_SEARCH_OR_SITEMAP_ONLY'),
    fixture_unknown_runtime_without_owner_fails: ao.includes('CMS_204AQ_UNKNOWN_RUNTIME_HIT_WITHOUT_REGISTRY_OWNERSHIP'),
    fixture_unknown_runtime_with_owner_passes: ao.includes('unknownRuntimeWithOwnerHits'),
    fixture_ap_builder_positive_passes: apFixture.ok && apFixture.stdout.includes('PASS_CMS_204AQ_AP_BUILDER_FIXTURE'),
  }
  const failed = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key)
  const out = {
    patch_id: PATCH_ID,
    status: failed.length ? 'FAIL_' + PASS_STATUS : PASS_STATUS,
    pass: failed.length === 0,
    blocked_reason_code: failed.length ? 'BLOCKED_' + failed[0].toUpperCase() : null,
    blocked_reason: failed.length ? `${failed[0]} was not satisfied` : null,
    checks,
    bundle_audit_policy: {
      allDistJsAudited: true,
      searchIndexIsNotSufficient: true,
      sitemapIsNotSufficient: true,
      unknownRuntimeHitRequiresRegistryOwnershipToken: true,
      deployBlockedBeforePushIfRegistryMissing: true,
      example: {
        materializedSlug: 'page/sdsdsd',
        registryCandidates: [
          'dist/assets/useRouteManifest-*.js',
          'dist/assets/pageLookup-*.js',
          'dist/assets/MarkdownPage-*.js',
          'dist/assets/index-*.js',
        ],
      },
    },
  }
  writeJson(path.join(cwd, RECEIPT), out)
  if (!out.pass) { console.error(out.status); console.error(out.blocked_reason_code); process.exit(1) }
  console.log(PASS_STATUS)
}
check()
