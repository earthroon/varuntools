# PUBLIC-ASSET-SSOT-04M-B1 apply note

Patch ID: PUBLIC-ASSET-SSOT-04M-B1

Scope:
- Add afterFirstPaint utility.
- Defer runtime public content index fetch until after first paint or idle.
- Remove public-content-index Date.now cache buster.
- Remove no-store fetch mode for runtime index.
- Skip runtime index fetch when Save-Data is enabled.
- Replace App direct CommandPalette import with CommandPaletteShell.
- Load CommandPalette through async component after first paint.

Apply from repo root:

```powershell
$PATCH = "D:\11124\dd\_patch\PUBLIC-ASSET-SSOT-04M-B1"

function Copy-PatchFile($name, $dest, $required = $true) {
  $file = Get-ChildItem $PATCH -Recurse -File |
    Where-Object { $_.Name -eq $name } |
    Select-Object -First 1

  if (-not $file) {
    if ($required) { throw "Missing patch file: $name" }
    Write-Host "SKIP optional missing: $name" -ForegroundColor Yellow
    return
  }

  $destDir = Split-Path $dest -Parent
  if ($destDir) { New-Item -ItemType Directory -Force $destDir | Out-Null }
  Copy-Item $file.FullName $dest -Force
  Write-Host "COPIED $name -> $dest" -ForegroundColor Green
}

Copy-PatchFile "afterFirstPaint.ts" ".\src\utils\afterFirstPaint.ts"
Copy-PatchFile "CommandPaletteShell.vue" ".\src\components\CommandPaletteShell.vue"
Copy-PatchFile "App.vue" ".\src\App.vue"
Copy-PatchFile "useRuntimePublicContentIndex.ts" ".\src\composables\useRuntimePublicContentIndex.ts"
Copy-PatchFile "smoke-public-asset-ssot-04m-b1-mobile-entry-fast-path.mjs" ".\scripts\smoke-public-asset-ssot-04m-b1-mobile-entry-fast-path.mjs"
Copy-PatchFile "PUBLIC_ASSET_SSOT_04M_B1_SPEC.md" ".\docs\PUBLIC_ASSET_SSOT_04M_B1_SPEC.md" $false
Copy-PatchFile "PUBLIC_ASSET_SSOT_04M_B1_MANIFEST.json" ".\PUBLIC_ASSET_SSOT_04M_B1_MANIFEST.json" $false
Copy-PatchFile "PUBLIC_ASSET_SSOT_04M_B1_APPLY.md" ".\PUBLIC_ASSET_SSOT_04M_B1_APPLY.md" $false
```

Verify:

```powershell
node .\scripts\smoke-public-asset-ssot-04m-b1-mobile-entry-fast-path.mjs
npm run build
```

Expected:

```txt
PASS_PUBLIC_ASSET_SSOT_04M_B1_MOBILE_ENTRY_FAST_PATH
```
