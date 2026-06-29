# PUBLIC-ASSET-SSOT-04M-U1-R2 Apply

## Apply

```powershell
cd "D:\11124\dd\varuntools"

$ZIP = "$env:USERPROFILE\Downloads\PUBLIC-ASSET-SSOT-04M-U1-R2_baked.zip"
$PATCH = "D:\11124\dd\_patch\PUBLIC-ASSET-SSOT-04M-U1-R2"

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

Copy-PatchFile "MarkdownToc.vue" ".\src\components\markdown\MarkdownToc.vue"
Copy-PatchFile "HomeRecentPublicContent.vue" ".\src\components\home\HomeRecentPublicContent.vue"
Copy-PatchFile "apply-public-asset-ssot-04m-u1-r2-vue-owned-mobile-toc.mjs" ".\scripts\apply-public-asset-ssot-04m-u1-r2-vue-owned-mobile-toc.mjs"
Copy-PatchFile "smoke-public-asset-ssot-04m-u1-r2-vue-owned-mobile-toc.mjs" ".\scripts\smoke-public-asset-ssot-04m-u1-r2-vue-owned-mobile-toc.mjs"
Copy-PatchFile "PUBLIC_ASSET_SSOT_04M_U1_R2_SPEC.md" ".\docs\PUBLIC_ASSET_SSOT_04M_U1_R2_SPEC.md" $false
Copy-PatchFile "PUBLIC_ASSET_SSOT_04M_U1_R2_MANIFEST.json" ".\PUBLIC_ASSET_SSOT_04M_U1_R2_MANIFEST.json" $false
Copy-PatchFile "PUBLIC_ASSET_SSOT_04M_U1_R2_APPLY.md" ".\PUBLIC_ASSET_SSOT_04M_U1_R2_APPLY.md" $false

node .\scripts\apply-public-asset-ssot-04m-u1-r2-vue-owned-mobile-toc.mjs
```

## Verify

```powershell
node .\scripts\smoke-public-asset-ssot-04m-u1-r2-vue-owned-mobile-toc.mjs
npm run build
```

Expected:

```txt
PASS_PUBLIC_ASSET_SSOT_04M_U1_R2_APPLY_VUE_OWNED_MOBILE_TOC
PASS_PUBLIC_ASSET_SSOT_04M_U1_R2_VUE_OWNED_MOBILE_TOC
```

## Commit

```powershell
git status --short

git add .\src\components\markdown\MarkdownToc.vue
git add .\src\components\home\HomeRecentPublicContent.vue
git add .\src\styles\markdown-works.css
git add .\scripts\apply-public-asset-ssot-04m-u1-r2-vue-owned-mobile-toc.mjs
git add .\scripts\smoke-public-asset-ssot-04m-u1-r2-vue-owned-mobile-toc.mjs
git add .\docs\PUBLIC_ASSET_SSOT_04M_U1_R2_SPEC.md
git add .\PUBLIC_ASSET_SSOT_04M_U1_R2_MANIFEST.json

if (Test-Path ".\PUBLIC_ASSET_SSOT_04M_U1_R2_APPLY.md") {
  git add .\PUBLIC_ASSET_SSOT_04M_U1_R2_APPLY.md
}

git commit -m "fix(public): dock mobile toc with vue state"
git pull --rebase origin main
git push origin main
```
