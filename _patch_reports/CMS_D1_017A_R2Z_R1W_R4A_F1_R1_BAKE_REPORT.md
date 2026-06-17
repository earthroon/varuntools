# CMS-D1-017A-R2Z-R1W-R4A-F1-R1 Bake Report

## Status

Baked as repo-root overlay for `earthroon/varuntools`.

## Patch

`CMS-D1-017A-R2Z-R1W-R4A-F1-R1`

## Source workflow

- Repository: `earthroon/varuntools`
- Path: `.github/workflows/publish-admin-content.yml`
- Source blob SHA observed before patch: `6b5e5142d839639b982c11dfbea57a0c0878475b`

## Changes

- Removed ineffective dry smoke `exit 0` assumption from `Validate inputs` as the only gate.
- Added explicit `Dry visibility smoke seal` step.
- Added explicit dry visibility artifact upload.
- Added `if: ${{ inputs.publish_mode != 'cms-dispatch-visibility-smoke' }}` to checkout, claim, export, materialize, branch/PR/finalize, and normal publish receipt upload paths.
- Added static smoke script.

## Boundaries

- No GitHub write during bake.
- No workflow dispatch during bake.
- No VACMS claim/export/finalize during bake.
- No token value written.
