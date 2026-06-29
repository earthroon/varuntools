# PUBLIC-ASSET-SSOT-04M-B3-R2 apply

```powershell
cd "D:\11124\dd\varuntools"

$ZIP = "$env:USERPROFILE\Downloads\PUBLIC-ASSET-SSOT-04M-B3-R2_baked.zip"
$PATCH = "D:\11124\dd\_patch\PUBLIC-ASSET-SSOT-04M-B3-R2"

Remove-Item $PATCH -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force $PATCH | Out-Null
Expand-Archive -Path $ZIP -DestinationPath $PATCH -Force

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

Copy-PatchFile "homeCollections.generated.json" ".\src\content\generated\homeCollections.generated.json"
Copy-PatchFile "useHomeCollections.ts" ".\src\composables\useHomeCollections.ts"
Copy-PatchFile "HomePage.vue" ".\src\pages\HomePage.vue"
Copy-PatchFile "HomeRecentPublicContent.vue" ".\src\components\home\HomeRecentPublicContent.vue"
Copy-PatchFile "HomeFeaturedWorks.vue" ".\src\components\home\HomeFeaturedWorks.vue"
Copy-PatchFile "build-home-collections.mjs" ".\scripts\build-home-collections.mjs"
Copy-PatchFile "smoke-public-asset-ssot-04m-b3-r2-home-critical-render-stability.mjs" ".\scripts\smoke-public-asset-ssot-04m-b3-r2-home-critical-render-stability.mjs"
Copy-PatchFile "PUBLIC_ASSET_SSOT_04M_B3_R2_SPEC.md" ".\docs\PUBLIC_ASSET_SSOT_04M_B3_R2_SPEC.md" $false
Copy-PatchFile "PUBLIC_ASSET_SSOT_04M_B3_R2_MANIFEST.json" ".\PUBLIC_ASSET_SSOT_04M_B3_R2_MANIFEST.json" $false
Copy-PatchFile "PUBLIC_ASSET_SSOT_04M_B3_R2_APPLY.md" ".\PUBLIC_ASSET_SSOT_04M_B3_R2_APPLY.md" $false
```

## Generate/check

```powershell
node .\scripts\build-home-collections.mjs
node .\scripts\build-home-collections.mjs --check
node .\scripts\smoke-public-asset-ssot-04m-b3-r2-home-critical-render-stability.mjs
npm run build
```

Expected:

```txt
PASS_PUBLIC_ASSET_SSOT_04M_B3_R2_HOME_CRITICAL_RENDER_STABILITY
```
