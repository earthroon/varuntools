# CMS-207M-R1A

## Identity

`SAME-PAGE-REVISION-REPLACEMENT / PAGE-ID-IDENTITY-SSOT / CURRENT-REVISION-MATERIALIZATION / IN-PLACE-PUBLIC-SNAPSHOT-UPDATE / SUPERSEDED-REVISION-RETIREMENT / STALE-PATH-RETIREMENT / ROUTE-MOVE-AS-SAME-PAGE / DELETE-AND-COMMIT-PREDECESSOR / NO-NEW-PAGE-REQUIREMENT`

## Purpose

A VACMS page is identified by `pageId`. `revisionId` identifies a version of that page. `generatedPath` is the current public materialization address and does not own entity identity.

A title, body, summary, metadata, or asset edit that creates a new revision MUST update the existing public page instead of requiring a new CMS page. A route/path move MUST preserve `pageId`, retire the predecessor source path, rebuild derived projections, and commit the deletion and new current snapshot together.

## SSOT

| State | Authority |
| --- | --- |
| Entity identity | VACMS `page.id` / public `vacmsPageId` |
| Current revision | VACMS export `revision.id` |
| Current materialized path | export `snapshot.generatedPath` |
| Current public source | `src/content/pages/**/index.md` |
| Projection sidecar | `src/content/generated/vacms-pages/<pageId>.projection.json` |
| Predecessor inventory | checked-out public repository `HEAD` |
| Public mutation transaction | GitHub Actions worktree + `commit-vacms-materialized-source.mjs` |

Identity ordering is `pageId > revisionId > generatedPath`.

## Transition matrix

| Baseline | Incoming | Transition | Required effect |
| --- | --- | --- | --- |
| no predecessor | current page | `first_publish` | create current source |
| same pageId, same path, new revision | current revision | `in_place_revision_replacement` | overwrite same source path |
| same pageId, same path, same revision, same bytes | replay | `idempotent_noop` | no semantic mutation |
| same pageId, different path | current revision | `route_move` | delete predecessor + create current path |
| >1 baseline paths for same pageId | any | blocked | `E_CMS207M_R1A_DUPLICATE_PAGE_IDENTITY_PATHS` |
| target path owned by another VACMS page | any | blocked | `E_CMS207M_R1A_TARGET_PATH_OWNED_BY_OTHER_VACMS_PAGE` |
| target path owned by repository content | any | blocked | `E_CMS207M_R1A_TARGET_PATH_OWNED_BY_REPOSITORY_CONTENT` |

## Transaction order

1. Claim/export remains unchanged.
2. Materialize incoming Markdown and current page projection sidecar.
3. `cms207m-r1a-reconcile-page-identity.mjs` inventories the checked-out `HEAD` by `vacmsPageId`.
4. Validate target ownership.
5. Classify `first_publish`, `idempotent_noop`, `in_place_revision_replacement`, or `route_move`.
6. Retire only exact stale predecessor paths whose live `vacmsPageId` still matches the incoming page.
7. Assert exactly one current Markdown remains for the page and that Markdown revision, path, and sidecar revision agree.
8. Build public content projection, public asset manifest, and Home collections.
9. Stage current source, sidecar, derived projection files, and predecessor deletions as one source mutation set.
10. Commit and push atomically through the existing VACMS source-commit authority.

## Revision mismatch policy

The existing Markdown-to-sidecar revision parity gate remains fail-closed. R1A does not hide or weaken revision mismatch. It reconciles/retire predecessors before the projection builder runs so the builder sees one current snapshot.

## Current snapshot invariant

After reconciliation, for each incoming VACMS page:

- exactly one live Markdown has `source: vacms` and matching `vacmsPageId`;
- its path equals the incoming `generatedPath`;
- its `vacmsRevisionId` equals the incoming revision;
- the sidecar `page.pageId` equals the incoming page ID;
- the sidecar `page.revisionId` equals the incoming revision;
- every retired predecessor path is absent from the worktree before projection build.

## Commit invariant

A route/path move MUST commit these effects together:

- deletion of predecessor Markdown;
- addition/update of current Markdown;
- update of page projection sidecar;
- update of `publicContentProjection.generated.json`;
- update of `publicAssetManifest.generated.json`;
- update of `homeCollections.generated.json`.

The commit script stages the exact mutation set with `git add -A -- <exact paths>` and validates every declared retired path is staged as a deletion with rename detection disabled for the check.

## Fail-closed errors

- `E_CMS207M_R1A_PAGE_ID_MISSING`
- `E_CMS207M_R1A_REVISION_ID_MISSING`
- `E_CMS207M_R1A_CURRENT_PATH_UNSAFE`
- `E_CMS207M_R1A_DUPLICATE_PAGE_IDENTITY_PATHS`
- `E_CMS207M_R1A_TARGET_PATH_OWNED_BY_OTHER_VACMS_PAGE`
- `E_CMS207M_R1A_TARGET_PATH_OWNED_BY_REPOSITORY_CONTENT`
- `E_CMS207M_R1A_SAME_REVISION_CONTENT_DRIFT`
- `E_CMS207M_R1A_PREDECESSOR_RETIREMENT_FAILED`
- `E_CMS207M_R1A_STALE_PATH_STILL_VISIBLE`
- `E_CMS207M_R1A_CURRENT_SNAPSHOT_PARITY_FAILED`
- `CMS_207M_R1A_PREDECESSOR_DELETION_NOT_STAGED`

## Boundaries

R1A performs no D1 migration, no D1 mutation, no R2 mutation, no asset garbage collection, and no public WASM execution. It only closes public materialization identity and Git source-transaction semantics.

## Regression invariants

- No new CMS page required for revision changes.
- No `revisionId` as entity identity.
- No `generatedPath` as entity identity.
- No title/slug/timestamp guessing for predecessor selection.
- No silent revision mismatch acceptance.
- No duplicate live paths for one `pageId`.
- No route/path move without predecessor retirement.
- No split commit between predecessor deletion and current snapshot creation.
- No unrelated file deletion.
- No repository-authored target overwrite.

## Required smoke seal

`npm run smoke:cms207m:r1a` must close:

- page-ID identity/transition classification;
- in-place revision replacement;
- route move and predecessor deletion;
- deletion included in the actual source commit and pushed to a fixture remote;
- duplicate current-page identity blocked by the projection builder.

Final seal:

`PASS_CMS_207M_R1A_SAME_PAGE_REVISION_REPLACEMENT_PAGE_ID_IDENTITY_SSOT_CURRENT_REVISION_MATERIALIZATION_IN_PLACE_PUBLIC_SNAPSHOT_UPDATE_SUPERSEDED_REVISION_RETIREMENT_STALE_PATH_RETIREMENT_ROUTE_MOVE_AS_SAME_PAGE_DELETE_AND_COMMIT_PREDECESSOR_NO_NEW_PAGE_REQUIREMENT`
