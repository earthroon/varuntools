# PUBLIC-ASSET-SSOT-01 Apply

## Apply files

```powershell
cd "D:\11124\dd\varuntools"

$ZIP = "$env:USERPROFILE\Downloads\PUBLIC-ASSET-SSOT-01_baked.zip"
$PATCH = "D:\11124\dd\_patch\PUBLIC-ASSET-SSOT-01"

Remove-Item $PATCH -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force $PATCH | Out-Null
Expand-Archive -Path $ZIP -DestinationPath $PATCH -Force

Copy-Item "$PATCH\src\content\assetRegistry.ts" ".\src\content\assetRegistry.ts" -Force
Copy-Item "$PATCH\scripts\smoke-public-asset-ssot-01-worker-r2-delivery-base-rebind.mjs" ".\scripts\smoke-public-asset-ssot-01-worker-r2-delivery-base-rebind.mjs" -Force
Copy-Item "$PATCH\docs\PUBLIC_ASSET_SSOT_01_SPEC.md" ".\docs\PUBLIC_ASSET_SSOT_01_SPEC.md" -Force
Copy-Item "$PATCH\PUBLIC_ASSET_SSOT_01_APPLY.md" ".\PUBLIC_ASSET_SSOT_01_APPLY.md" -Force
Copy-Item "$PATCH\PUBLIC_ASSET_SSOT_01_MANIFEST.json" ".\PUBLIC_ASSET_SSOT_01_MANIFEST.json" -Force
```

## Verify

```powershell
cd "D:\11124\dd\varuntools"

node .\scripts\smoke-public-asset-ssot-01-worker-r2-delivery-base-rebind.mjs

git grep -n "varunasset.work"
git grep -n "example-poster.jpg"
git grep -n "/media/example-poster"

npm run build
```

Expected smoke token:

```txt
PASS_PUBLIC_ASSET_SSOT_01_WORKER_R2_DELIVERY_BASE_REBIND
```

The three `git grep` commands should print no matches.

## Commit

```powershell
git status --short

git add .\src\content\assetRegistry.ts
git add .\scripts\smoke-public-asset-ssot-01-worker-r2-delivery-base-rebind.mjs
git add .\docs\PUBLIC_ASSET_SSOT_01_SPEC.md
git add .\PUBLIC_ASSET_SSOT_01_APPLY.md
git add .\PUBLIC_ASSET_SSOT_01_MANIFEST.json

git commit -m "fix(public): rebind content asset base to VACMS worker delivery"
git pull --rebase origin main
git push origin main
```
