# PUBLIC-ASSET-SSOT-03H Apply

Run from the public varuntools repo root.

```powershell
cd "D:\11124\dd\varuntools"

$ZIP = "$env:USERPROFILE\Downloads\PUBLIC-ASSET-SSOT-03H_baked.zip"
$PATCH = "D:\11124\dd\_patch\PUBLIC-ASSET-SSOT-03H"

Remove-Item $PATCH -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force $PATCH | Out-Null
Expand-Archive -Path $ZIP -DestinationPath $PATCH -Force

Copy-Item "$PATCH\src\components\markdown\VideoPlayer.vue" ".\src\components\markdown\VideoPlayer.vue" -Force
Copy-Item "$PATCH\scripts\apply-public-asset-ssot-03h-video-preview.mjs" ".\scripts\apply-public-asset-ssot-03h-video-preview.mjs" -Force
Copy-Item "$PATCH\scripts\smoke-public-asset-ssot-03h-video-intrinsic-aspect-keyboard-toggle.mjs" ".\scripts\smoke-public-asset-ssot-03h-video-intrinsic-aspect-keyboard-toggle.mjs" -Force
Copy-Item "$PATCH\scripts\smoke-public-asset-ssot-03-video-directive-policy-rebind.mjs" ".\scripts\smoke-public-asset-ssot-03-video-directive-policy-rebind.mjs" -Force
Copy-Item "$PATCH\docs\PUBLIC_ASSET_SSOT_03H_SPEC.md" ".\docs\PUBLIC_ASSET_SSOT_03H_SPEC.md" -Force
Copy-Item "$PATCH\PUBLIC_ASSET_SSOT_03H_MANIFEST.json" ".\PUBLIC_ASSET_SSOT_03H_MANIFEST.json" -Force

node .\scripts\apply-public-asset-ssot-03h-video-preview.mjs
node .\scripts\smoke-public-asset-ssot-03h-video-intrinsic-aspect-keyboard-toggle.mjs
npm run build
```

Commit:

```powershell
git status --short

git add .\src\components\markdown\VideoPlayer.vue
git add .\src\styles\markdown-components.css
git add .\scripts\apply-public-asset-ssot-03h-video-preview.mjs
git add .\scripts\smoke-public-asset-ssot-03h-video-intrinsic-aspect-keyboard-toggle.mjs
git add .\scripts\smoke-public-asset-ssot-03-video-directive-policy-rebind.mjs
git add .\docs\PUBLIC_ASSET_SSOT_03H_SPEC.md
git add .\PUBLIC_ASSET_SSOT_03H_MANIFEST.json

git commit -m "fix(public): adapt video preview aspect and keyboard playback"
git pull --rebase origin main
git push origin main
```
