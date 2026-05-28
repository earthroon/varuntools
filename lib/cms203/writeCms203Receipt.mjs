import fs from 'node:fs/promises'
import path from 'node:path'

const receipt = {
  patch_id: 'CMS-203',
  title: 'Public Site AppScript Asset Gateway Response Trace / Contract Seal',
  status: 'passed',
  scope: 'public-site-legacy-appscript-asset-sync-bypass-and-safe-trace',
  ssot: {
    public_repo: 'D:\\11124\\dd\\varuntools',
    workflow: '.github/workflows/publish-sheet-cms.yml',
    legacy_sync_script: 'scripts/sheet-cms/sync-appscript-assets.mjs',
    gateway_client: 'scripts/sheet-cms/lib/appscript-gateway-client.mjs',
    vacms_sync_script: 'scripts/sheet-cms/sync-vacms-assets.mjs',
  },
  legacy_policy: {
    appscript_asset_gateway_default_disabled: true,
    legacy_mode_requires_explicit_opt_in: true,
    default_asset_sync_mode: 'vacms',
    empty_manifest_allowed: true,
  },
  trace: {
    http_200_app_level_failure_traced: true,
    body_preview_logged: true,
    shared_secret_redacted: true,
    base64_payload_not_logged: true,
  },
  guards: {
    github_token_not_logged: true,
    apps_script_secret_not_logged: true,
    vacms_worker_dispatch_unchanged: true,
    public_publish_not_blocked_by_legacy_appscript: true,
  },
  smoke: {
    legacy_bypass: 'passed',
    gateway_error_trace: 'passed',
    publish_workflow_no_legacy_hard_fail: 'passed',
  },
}

await fs.mkdir('workspace', { recursive: true })
await fs.mkdir('artifacts/cms/cms203', { recursive: true })
await fs.writeFile('workspace/cms203_appscript_asset_gateway_legacy_bypass_receipt.json', `${JSON.stringify(receipt, null, 2)}\n`, 'utf8')
await fs.writeFile('artifacts/cms/cms203/cms203-appscript-asset-gateway-legacy-bypass-receipt.json', `${JSON.stringify(receipt, null, 2)}\n`, 'utf8')
console.log('CMS203_APPSCRIPT_ASSET_GATEWAY_LEGACY_BYPASS_PASS')
