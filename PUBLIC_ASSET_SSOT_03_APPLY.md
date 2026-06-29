# PUBLIC-ASSET-SSOT-03 Apply

## Copy patch files

```powershell
cd "D:\11124\dd\varuntools"

$ZIP = "$env:USERPROFILE\Downloads\PUBLIC-ASSET-SSOT-03_baked.zip"
$PATCH = "D:\11124\dd\_patch\PUBLIC-ASSET-SSOT-03"

Remove-Item $PATCH -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force $PATCH | Out-Null
Expand-Archive -Path $ZIP -DestinationPath $PATCH -Force

Copy-Item "$PATCH\src\markdown\directives\videoPlayerDirective.ts" ".\src\markdown\directives\videoPlayerDirective.ts" -Force
Copy-Item "$PATCH\src\markdown\mediaAssetTypes.ts" ".\src\markdown\mediaAssetTypes.ts" -Force
Copy-Item "$PATCH\scripts\smoke-public-asset-ssot-03-video-directive-policy-rebind.mjs" ".\scripts\smoke-public-asset-ssot-03-video-directive-policy-rebind.mjs" -Force
Copy-Item "$PATCH\docs\PUBLIC_ASSET_SSOT_03_SPEC.md" ".\docs\PUBLIC_ASSET_SSOT_03_SPEC.md" -Force
Copy-Item "$PATCH\PUBLIC_ASSET_SSOT_03_APPLY.md" ".\PUBLIC_ASSET_SSOT_03_APPLY.md" -Force
Copy-Item "$PATCH\PUBLIC_ASSET_SSOT_03_MANIFEST.json" ".\PUBLIC_ASSET_SSOT_03_MANIFEST.json" -Force
```

## Validate

```powershell
node .\scripts\smoke-public-asset-ssot-03-video-directive-policy-rebind.mjs
npm run build
```

## Commit

```powershell
git status --short

git add .\src\markdown\directives\videoPlayerDirective.ts
git add .\src\markdown\mediaAssetTypes.ts
git add .\scripts\smoke-public-asset-ssot-03-video-directive-policy-rebind.mjs
git add .\docs\PUBLIC_ASSET_SSOT_03_SPEC.md
git add .\PUBLIC_ASSET_SSOT_03_APPLY.md
git add .\PUBLIC_ASSET_SSOT_03_MANIFEST.json

git commit -m "fix(public): enforce video directive asset policy"
git pull --rebase origin main
git push origin main
```
