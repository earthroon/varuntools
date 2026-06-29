# PUBLIC-ASSET-SSOT-04M-C1 Apply

```powershell
cd "D:\11124\dd\varuntools"

$ZIP = "$env:USERPROFILE\Downloads\PUBLIC-ASSET-SSOT-04M-C1_baked.zip"
$PATCH = "D:\11124\dd\_patch\PUBLIC-ASSET-SSOT-04M-C1"

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

Copy-PatchFile "typography.css" ".\src\styles\typography.css"
Copy-PatchFile "main.ts" ".\src\main.ts"
Copy-PatchFile "CommandPalette.vue" ".\src\components\CommandPalette.vue"
Copy-PatchFile "SearchPage.vue" ".\src\pages\SearchPage.vue"
Copy-PatchFile "apply-public-asset-ssot-04m-c1-critical-render-css-split.mjs" ".\scripts\apply-public-asset-ssot-04m-c1-critical-render-css-split.mjs"
Copy-PatchFile "smoke-public-asset-ssot-04m-c1-critical-render-css-split.mjs" ".\scripts\smoke-public-asset-ssot-04m-c1-critical-render-css-split.mjs"
Copy-PatchFile "PUBLIC_ASSET_SSOT_04M_C1_SPEC.md" ".\docs\PUBLIC_ASSET_SSOT_04M_C1_SPEC.md" $false
Copy-PatchFile "PUBLIC_ASSET_SSOT_04M_C1_MANIFEST.json" ".\PUBLIC_ASSET_SSOT_04M_C1_MANIFEST.json" $false
Copy-PatchFile "PUBLIC_ASSET_SSOT_04M_C1_APPLY.md" ".\PUBLIC_ASSET_SSOT_04M_C1_APPLY.md" $false

node .\scripts\apply-public-asset-ssot-04m-c1-critical-render-css-split.mjs
```

## Verify

```powershell
node .\scripts\smoke-public-asset-ssot-04m-c1-critical-render-css-split.mjs
npm run build
```

Expected:

```txt
PASS_PUBLIC_ASSET_SSOT_04M_C1_CRITICAL_RENDER_CSS_SPLIT
```

## Commit

```powershell
git status --short

git add .\src\styles\typography.css
git add .\src\main.ts
git add .\src\components\CommandPalette.vue
git add .\src\pages\SearchPage.vue
git add .\src\components\markdown\MarkdownLightbox.vue
git add .\scripts\apply-public-asset-ssot-04m-c1-critical-render-css-split.mjs
git add .\scripts\smoke-public-asset-ssot-04m-c1-critical-render-css-split.mjs
git add .\docs\PUBLIC_ASSET_SSOT_04M_C1_SPEC.md
git add .\PUBLIC_ASSET_SSOT_04M_C1_MANIFEST.json

if (Test-Path ".\PUBLIC_ASSET_SSOT_04M_C1_APPLY.md") {
  git add .\PUBLIC_ASSET_SSOT_04M_C1_APPLY.md
}

git commit -m "perf(public): split critical render css"
git pull --rebase origin main
git push origin main
```
