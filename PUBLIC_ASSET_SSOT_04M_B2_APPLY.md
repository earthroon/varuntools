# PUBLIC-ASSET-SSOT-04M-B2 Apply

## Apply

```powershell
cd "D:\11124\dd\varuntools"

$ZIP = "$env:USERPROFILE\Downloads\PUBLIC-ASSET-SSOT-04M-B2_baked.zip"
$PATCH = "D:\11124\dd\_patch\PUBLIC-ASSET-SSOT-04M-B2"

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

Copy-PatchFile "loadMarkdownPageFromSource.ts" ".\src\markdown\loadMarkdownPageFromSource.ts"
Copy-PatchFile "lazyMarkdownPageLoader.ts" ".\src\markdown\lazyMarkdownPageLoader.ts"
Copy-PatchFile "markdownRouteIndex.generated.ts" ".\src\markdown\markdownRouteIndex.generated.ts"
Copy-PatchFile "loadMarkdownPages.ts" ".\src\markdown\loadMarkdownPages.ts"
Copy-PatchFile "MarkdownPage.vue" ".\src\pages\MarkdownPage.vue"
Copy-PatchFile "MarkdownDocumentView.vue" ".\src\components\markdown\MarkdownDocumentView.vue"
Copy-PatchFile "build-markdown-route-index.mjs" ".\scripts\build-markdown-route-index.mjs"
Copy-PatchFile "smoke-public-asset-ssot-04m-b2-current-route-lazy-markdown.mjs" ".\scripts\smoke-public-asset-ssot-04m-b2-current-route-lazy-markdown.mjs"
Copy-PatchFile "PUBLIC_ASSET_SSOT_04M_B2_SPEC.md" ".\docs\PUBLIC_ASSET_SSOT_04M_B2_SPEC.md" $false
Copy-PatchFile "PUBLIC_ASSET_SSOT_04M_B2_MANIFEST.json" ".\PUBLIC_ASSET_SSOT_04M_B2_MANIFEST.json" $false
Copy-PatchFile "PUBLIC_ASSET_SSOT_04M_B2_APPLY.md" ".\PUBLIC_ASSET_SSOT_04M_B2_APPLY.md" $false
```

## Generate route index

```powershell
node .\scripts\build-markdown-route-index.mjs
```

## Verify

```powershell
node .\scripts\build-markdown-route-index.mjs --check
node .\scripts\smoke-public-asset-ssot-04m-b2-current-route-lazy-markdown.mjs
npm run build
```

Expected token:

```txt
PASS_PUBLIC_ASSET_SSOT_04M_B2_CURRENT_ROUTE_LAZY_MARKDOWN
```

## Commit

```powershell
git status --short

git add .\src\markdown\loadMarkdownPageFromSource.ts
git add .\src\markdown\lazyMarkdownPageLoader.ts
git add .\src\markdown\markdownRouteIndex.generated.ts
git add .\src\markdown\loadMarkdownPages.ts
git add .\src\pages\MarkdownPage.vue
git add .\src\components\markdown\MarkdownDocumentView.vue
git add .\scripts\build-markdown-route-index.mjs
git add .\scripts\smoke-public-asset-ssot-04m-b2-current-route-lazy-markdown.mjs
git add .\docs\PUBLIC_ASSET_SSOT_04M_B2_SPEC.md
git add .\PUBLIC_ASSET_SSOT_04M_B2_MANIFEST.json

if (Test-Path ".\PUBLIC_ASSET_SSOT_04M_B2_APPLY.md") {
  git add .\PUBLIC_ASSET_SSOT_04M_B2_APPLY.md
}

git commit -m "perf(public): lazy load current markdown route"
git pull --rebase origin main
git push origin main
```
