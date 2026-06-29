# PUBLIC-ASSET-SSOT-03H-R3 Apply

```powershell
cd "D:\11124\dd\varuntools"

$ZIP = "$env:USERPROFILE\Downloads\PUBLIC-ASSET-SSOT-03H-R3_baked.zip"
$PATCH = "D:\11124\dd\_patch\PUBLIC-ASSET-SSOT-03H-R3"

Remove-Item $PATCH -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force $PATCH | Out-Null
Expand-Archive -Path $ZIP -DestinationPath $PATCH -Force

Copy-Item "$PATCH\src\components\markdown\VideoPlayer.vue" ".\src\components\markdown\VideoPlayer.vue" -Force
Copy-Item "$PATCH\scripts\apply-public-asset-ssot-03h-r3-video-js-measured-preview.mjs" ".\scripts\apply-public-asset-ssot-03h-r3-video-js-measured-preview.mjs" -Force
Copy-Item "$PATCH\scripts\smoke-public-asset-ssot-03h-r3-video-js-measured-preview.mjs" ".\scripts\smoke-public-asset-ssot-03h-r3-video-js-measured-preview.mjs" -Force
Copy-Item "$PATCH\docs\PUBLIC_ASSET_SSOT_03H_R3_SPEC.md" ".\docs\PUBLIC_ASSET_SSOT_03H_R3_SPEC.md" -Force
Copy-Item "$PATCH\PUBLIC_ASSET_SSOT_03H_R3_MANIFEST.json" ".\PUBLIC_ASSET_SSOT_03H_R3_MANIFEST.json" -Force

node .\scripts\apply-public-asset-ssot-03h-r3-video-js-measured-preview.mjs
node .\scripts\smoke-public-asset-ssot-03h-r3-video-js-measured-preview.mjs
npm run build
```

Commit:

```powershell
git add .\src\components\markdown\VideoPlayer.vue
git add .\src\styles\markdown-components.css
git add .\scripts\apply-public-asset-ssot-03h-r3-video-js-measured-preview.mjs
git add .\scripts\smoke-public-asset-ssot-03h-r3-video-js-measured-preview.mjs
git add .\docs\PUBLIC_ASSET_SSOT_03H_R3_SPEC.md
git add .\PUBLIC_ASSET_SSOT_03H_R3_MANIFEST.json

git commit -m "fix(public): measure video preview layout in player"
git pull --rebase origin main
git push origin main
```
