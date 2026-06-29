# PUBLIC-ASSET-SSOT-02 APPLY

## Apply

```powershell
cd "D:\11124\dd\varuntools"

$ZIP = "$env:USERPROFILE\Downloads\PUBLIC-ASSET-SSOT-02_baked.zip"
$PATCH = "D:\11124\dd\_patch\PUBLIC-ASSET-SSOT-02"

Remove-Item $PATCH -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force $PATCH | Out-Null
Expand-Archive -Path $ZIP -DestinationPath $PATCH -Force

Copy-Item "$PATCH\src\content\assetRegistry.ts" ".\src\content\assetRegistry.ts" -Force
Copy-Item "$PATCH\scripts\smoke-public-asset-ssot-02-content-asset-proxy-reason-rebind.mjs" ".\scripts\smoke-public-asset-ssot-02-content-asset-proxy-reason-rebind.mjs" -Force
Copy-Item "$PATCH\docs\PUBLIC_ASSET_SSOT_02_SPEC.md" ".\docs\PUBLIC_ASSET_SSOT_02_SPEC.md" -Force
Copy-Item "$PATCH\PUBLIC_ASSET_SSOT_02_APPLY.md" ".\PUBLIC_ASSET_SSOT_02_APPLY.md" -Force
Copy-Item "$PATCH\PUBLIC_ASSET_SSOT_02_MANIFEST.json" ".\PUBLIC_ASSET_SSOT_02_MANIFEST.json" -Force
```

## Verify

```powershell
node .\scripts\smoke-public-asset-ssot-02-content-asset-proxy-reason-rebind.mjs
npm run build

git grep -n "varunasset.work"
git grep -n "example-poster.jpg"
git grep -n "/media/example-poster"
```

Expected:

```txt
PASS_PUBLIC_ASSET_SSOT_02_CONTENT_ASSET_PROXY_REASON_REBIND
```

`git grep` checks for `varunasset.work`, `example-poster.jpg`, and `/media/example-poster` should produce no output.

## Commit

```powershell
git status --short

git add .\src\content\assetRegistry.ts
git add .\scripts\smoke-public-asset-ssot-02-content-asset-proxy-reason-rebind.mjs
git add .\docs\PUBLIC_ASSET_SSOT_02_SPEC.md
git add .\PUBLIC_ASSET_SSOT_02_APPLY.md
git add .\PUBLIC_ASSET_SSOT_02_MANIFEST.json

git commit -m "fix(public): classify VACMS content assets as content asset proxy"
git pull --rebase origin main
git push origin main
```
