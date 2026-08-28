# CMS-207M-R1 PUBLIC / varuntools bake

Target repository: earthroon/varuntools
Patch: CMS-207M-R1

## Apply

Run from the root of the local varuntools repository:

```powershell
node "<EXTRACTED_PATH>\CMS_207M_R1_PUBLIC_BAKE\apply-cms207m-r1-varuntools.mjs" --dry-run
node "<EXTRACTED_PATH>\CMS_207M_R1_PUBLIC_BAKE\apply-cms207m-r1-varuntools.mjs"
```

Do not use `--force` if the dry-run reports a base SHA mismatch. Re-align the current public repo SSOT first.

## Included public scope

- versioned public projection consumer
- public asset manifest generation
- home/index single-projection generation
- CMS-207H / CMS-207F stale smoke realignment
- `videoAssetId` public asset projection lookup
- no direct D1 coupling
- no public WASM coupling

VACMS producer changes are intentionally excluded from this standalone public bundle.
