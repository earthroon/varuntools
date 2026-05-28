# CMS-203 — Public Site AppScript Asset Gateway Response Trace / Contract Seal

## Status

Baked as a public-site patch bundle for `D:\11124\dd\varuntools`.

## Applied intent

AppScript is legacy. The default public publish path must not hard-fail because the legacy AppScript asset gateway returns an app-level failure with HTTP 200.

## Files added

- `scripts/sheet-cms/sync-drive-assets.mjs`
- `scripts/sheet-cms/sync-vacms-assets.mjs`
- `scripts/sheet-cms/lib/asset-sync-mode.mjs`
- `tools/cms203/apply-cms203-public-site-patch.mjs`
- `tools/cms203/apply-cms203-public-site-patch.ps1`
- `lib/cms203/*`
- `scripts/cms203-*.mjs`
- `artifacts/cms/cms203/*`
- `workspace/cms203_appscript_asset_gateway_legacy_bypass_receipt.json`

## Files patched by the patch runner

- `package.json`
- `.github/workflows/publish-sheet-cms.yml`
- `scripts/sheet-cms/lib/appscript-gateway-client.mjs`

## Smoke

Run from the public site repo root:

```powershell
node .\scripts\cms203-appscript-legacy-bypass-smoke.mjs
node .\scripts\cms203-gateway-error-trace-smoke.mjs
node .\scripts\cms203-publish-workflow-no-legacy-hard-fail-smoke.mjs
node .\scripts\cms203-write-receipt.mjs
```

Expected:

```txt
CMS203_APPSCRIPT_LEGACY_BYPASS_PASS
CMS203_GATEWAY_ERROR_TRACE_PASS
CMS203_PUBLISH_WORKFLOW_NO_LEGACY_HARD_FAIL_PASS
CMS203_APPSCRIPT_ASSET_GATEWAY_LEGACY_BYPASS_PASS
```
