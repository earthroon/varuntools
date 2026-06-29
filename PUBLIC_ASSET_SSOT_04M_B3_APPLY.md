# PUBLIC-ASSET-SSOT-04M-B3 Apply

## Apply

```powershell
cd "D:\11124\dd\varuntools"

$ZIP = "$env:USERPROFILE\Downloads\PUBLIC-ASSET-SSOT-04M-B3_baked.zip"
$PATCH = "D:\11124\dd\_patch\PUBLIC-ASSET-SSOT-04M-B3"

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
Copy-PatchFile "smoke-public-asset-ssot-04m-b3-home-fast-path.mjs" ".\scripts\smoke-public-asset-ssot-04m-b3-home-fast-path.mjs"
Copy-PatchFile "PUBLIC_ASSET_SSOT_04M_B3_SPEC.md" ".\docs\PUBLIC_ASSET_SSOT_04M_B3_SPEC.md" $false
Copy-PatchFile "PUBLIC_ASSET_SSOT_04M_B3_MANIFEST.json" ".\PUBLIC_ASSET_SSOT_04M_B3_MANIFEST.json" $false
Copy-PatchFile "PUBLIC_ASSET_SSOT_04M_B3_APPLY.md" ".\PUBLIC_ASSET_SSOT_04M_B3_APPLY.md" $false
```

## Build generated home collection index

```powershell
node .\scripts\build-home-collections.mjs
```

## Verify

```powershell
node .\scripts\build-home-collections.mjs --check
node .\scripts\smoke-public-asset-ssot-04m-b3-home-fast-path.mjs
npm run build
```

Expected:

```txt
PASS_PUBLIC_ASSET_SSOT_04M_B3_HOME_COLLECTIONS_CHECK
PASS_PUBLIC_ASSET_SSOT_04M_B3_HOME_FAST_PATH
```

## Commit

```powershell
git status --short

git add .\src\content\generated\homeCollections.generated.json
git add .\src\composables\useHomeCollections.ts
git add .\src\pages\HomePage.vue
git add .\src\components\home\HomeRecentPublicContent.vue
git add .\src\components\home\HomeFeaturedWorks.vue
git add .\scripts\build-home-collections.mjs
git add .\scripts\smoke-public-asset-ssot-04m-b3-home-fast-path.mjs
git add .\docs\PUBLIC_ASSET_SSOT_04M_B3_SPEC.md
git add .\PUBLIC_ASSET_SSOT_04M_B3_MANIFEST.json

if (Test-Path ".\PUBLIC_ASSET_SSOT_04M_B3_APPLY.md") {
  git add .\PUBLIC_ASSET_SSOT_04M_B3_APPLY.md
}

git commit -m "perf(public): use lightweight home collections"
git pull --rebase origin main
git push origin main
```
