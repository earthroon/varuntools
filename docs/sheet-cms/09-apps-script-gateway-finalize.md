# 09. Apps Script Gateway finalize / staging cleanup

## SSOT contract

VarunTools Sheet CMS treats Google Sheets as a staging publish console, not a permanent database.

- Before publish: Google Sheet staging rows are the authoring source.
- During publish: GitHub Actions uses `.sheet-cms-cache` as ephemeral raw input.
- After successful publish: repo generated files become the published state.
- After successful publish: Apps Script archives and clears staged rows.

## Supported Apps Script actions

The Apps Script Web App supports these `doPost` actions:

```txt
ping
snapshot
assets
publish
finalize
```

### `finalize`

GitHub Actions calls this after generated content is validated, built, committed, and pushed.

Request:

```json
{
  "action": "finalize",
  "secret": "***",
  "requestId": "pub_20260512_153011_a8f2",
  "status": "success",
  "commitSha": "abc123",
  "actionRunUrl": "https://github.com/earthroon/varuntools/actions/runs/1",
  "publishedPageIds": ["arosaegim-tool"]
}
```

Response:

```json
{
  "ok": true,
  "source": "apps-script-gateway",
  "requestId": "pub_20260512_153011_a8f2",
  "status": "success",
  "clearedRows": {
    "pages": 1,
    "blocks": 5,
    "assets": 3
  },
  "archivedRows": 9
}
```

## Cleanup rules

Finalize cleanup only runs when `status = success`.

Rows are selected by `publishedPageIds` and cleared only when `visible = Y`.

- `pages`: clears matching `pageId` rows except draft rows.
- `blocks`: clears matching `pageId` rows.
- `assets`: clears matching `pageId` rows.

Failed publish attempts do not clear staging rows.

## Archive rules

Before clearing, Apps Script copies each row into `published_archive`.

Archive columns:

```txt
archivedAt
requestId
pageId
sourceSheet
sourceRowNumber
rowJson
```

The archive sheet is created automatically if missing.

## GitHub Actions integration

`publish-sheet-cms.yml` calls:

```txt
npm run finalize:sheet-cms
```

after the commit step.

The commit step exposes:

```txt
steps.commit_generated.outputs.commit_sha
```

`finalize:sheet-cms` reads `.sheet-cms-cache/raw/*.raw.json` to collect staged page IDs and calls Apps Script action `finalize`.

## Local smoke

```bash
npm run smoke:finalize-publish
npm run smoke:publish-workflow
```

## Security

Never store these in a sheet cell, log, or generated JSON:

```txt
SHEET_CMS_SHARED_SECRET
GITHUB_DISPATCH_TOKEN
Authorization header
Drive file payload base64
```

