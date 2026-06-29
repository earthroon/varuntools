# PUBLIC-ASSET-SSOT-04M-U1 apply

```powershell
cd "D:\11124\dd\varuntools"

$ZIP = "$env:USERPROFILE\Downloads\PUBLIC-ASSET-SSOT-04M-U1_baked.zip"
$PATCH = "D:\11124\dd\_patch\PUBLIC-ASSET-SSOT-04M-U1"

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

Copy-PatchFile "apply-public-asset-ssot-04m-u1-mobile-toc-gutter-reserve.mjs" ".\scripts\apply-public-asset-ssot-04m-u1-mobile-toc-gutter-reserve.mjs"
Copy-PatchFile "smoke-public-asset-ssot-04m-u1-mobile-toc-gutter-reserve.mjs" ".\scripts\smoke-public-asset-ssot-04m-u1-mobile-toc-gutter-reserve.mjs"
Copy-PatchFile "PUBLIC_ASSET_SSOT_04M_U1_SPEC.md" ".\docs\PUBLIC_ASSET_SSOT_04M_U1_SPEC.md" $false
Copy-PatchFile "PUBLIC_ASSET_SSOT_04M_U1_MANIFEST.json" ".\PUBLIC_ASSET_SSOT_04M_U1_MANIFEST.json" $false
Copy-PatchFile "PUBLIC_ASSET_SSOT_04M_U1_APPLY.md" ".\PUBLIC_ASSET_SSOT_04M_U1_APPLY.md" $false

node .\scripts\apply-public-asset-ssot-04m-u1-mobile-toc-gutter-reserve.mjs
node .\scripts\smoke-public-asset-ssot-04m-u1-mobile-toc-gutter-reserve.mjs
npm run build
```

Expected:

```txt
PASS_PUBLIC_ASSET_SSOT_04M_U1_APPLY_MOBILE_TOC_GUTTER_RESERVE
PASS_PUBLIC_ASSET_SSOT_04M_U1_MOBILE_TOC_GUTTER_RESERVE
```
