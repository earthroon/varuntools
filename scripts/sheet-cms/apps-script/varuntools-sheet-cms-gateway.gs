/**
 * VarunTools Sheet CMS Apps Script Gateway
 *
 * Google-side authority lives here. GitHub Actions does not receive Google API keys.
 * Deploy as Web App and store secrets in Script Properties.
 *
 * Required Script Properties:
 * - SHEET_CMS_SHARED_SECRET
 * - GITHUB_DISPATCH_TOKEN
 * - GITHUB_OWNER = earthroon
 * - GITHUB_REPO = varuntools
 * - GITHUB_EVENT_TYPE = publish-sheet-content
 */

const REQUIRED_TABS = [
  'pages',
  'blocks',
  'assets',
  'settings',
  'enums_block_types',
  'enums_callout_types',
  'guide',
  'publish_log',
]

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('VARUNTOOLS')
    .addItem('게시 요청', 'requestPublish')
    .addItem('사전 검사', 'runPreflightCheck')
    .addSeparator()
    .addItem('발행 로그 열기', 'openPublishLog')
    .addItem('성공분 정리 미리보기', 'previewPublishedCleanup')
    .addItem('설정 확인', 'showConfigStatus')
    .addToUi()
}

function doPost(e) {
  try {
    const payload = parseJsonBody_(e)
    assertSharedSecret_(payload.secret)

    if (payload.action === 'ping') return json_({ ok: true, source: 'apps-script-gateway' })
    if (payload.action === 'snapshot') return json_(createSnapshot_(payload))
    if (payload.action === 'assets') return json_(createAssetPayloads_(payload))
    if (payload.action === 'publish') return json_(dispatchPublish_(payload))
    if (payload.action === 'finalize') return json_(finalizePublish_(payload))

    return json_({ ok: false, error: 'Unknown action: ' + payload.action }, 400)
  } catch (error) {
    return json_({ ok: false, error: error.message }, 500)
  }
}

function parseJsonBody_(e) {
  const raw = e && e.postData && e.postData.contents ? e.postData.contents : '{}'
  return JSON.parse(raw)
}

function json_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
}

function getProp_(key, fallback) {
  const value = PropertiesService.getScriptProperties().getProperty(key)
  return value || fallback || ''
}

function assertSharedSecret_(secret) {
  const expected = getProp_('SHEET_CMS_SHARED_SECRET')
  if (!expected) throw new Error('SHEET_CMS_SHARED_SECRET is not configured.')
  if (String(secret || '') !== expected) throw new Error('Invalid shared secret.')
}

function createSnapshot_(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const tabs = payload.tabs && payload.tabs.length ? payload.tabs : REQUIRED_TABS
  const out = {}

  tabs.forEach(function (tabName) {
    const sheet = ss.getSheetByName(tabName)
    if (!sheet) throw new Error('Required sheet is missing: ' + tabName)
    out[tabName] = sheet.getDataRange().getDisplayValues()
  })

  return {
    ok: true,
    source: 'apps-script-gateway',
    generatedAt: new Date().toISOString(),
    requestId: payload.requestId || '',
    tabs: out,
  }
}

function getRowsByHeader_(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName)
  if (!sheet) throw new Error('Sheet not found: ' + sheetName)
  const values = sheet.getDataRange().getDisplayValues()
  const headers = (values[0] || []).map(function (header) { return String(header || '').trim() })
  return values.slice(1).map(function (row, index) {
    const object = { __rowNumber: index + 2 }
    headers.forEach(function (header, columnIndex) {
      if (header) object[header] = String(row[columnIndex] || '').trim()
    })
    return object
  })
}

function enabled_(value) {
  return String(value || '').trim().toUpperCase() === 'Y'
}

function findAssetRow_(assetId) {
  const rows = getRowsByHeader_('assets')
  for (var i = 0; i < rows.length; i += 1) {
    if (String(rows[i].assetId || '').trim() === assetId) return rows[i]
  }
  return null
}

function createAssetPayloads_(payload) {
  const requested = payload.assets || []
  const requestMap = {}
  requested.forEach(function (item) {
    if (item && item.assetId) requestMap[String(item.assetId).trim()] = item
  })

  const rows = getRowsByHeader_('assets')
  const selected = rows.filter(function (row) {
    if (!enabled_(row.visible)) return false
    if (requested.length === 0) return true
    return Boolean(requestMap[String(row.assetId || '').trim()])
  })

  const assets = selected.map(function (row) {
    return createAssetPayload_(row, requestMap[String(row.assetId || '').trim()] || {})
  })

  return {
    ok: true,
    source: 'apps-script-gateway',
    generatedAt: new Date().toISOString(),
    requestId: payload.requestId || '',
    assets: assets,
  }
}

function createAssetPayload_(row, requestItem) {
  const assetId = String(row.assetId || requestItem.assetId || '').trim()
  if (!assetId) throw new Error('Asset row is missing assetId.')
  const type = String(row.type || requestItem.type || '').trim()
  if (!type) throw new Error('Asset is missing type: ' + assetId)

  const assetMode = String(row.assetMode || requestItem.assetMode || '').trim().toLowerCase()
  if (assetMode === 'external' || assetMode === 'video-large') {
    return {
      pageId: String(row.pageId || requestItem.pageId || '').trim(),
      assetId: assetId,
      type: type,
      role: String(row.role || requestItem.role || '').trim(),
      assetMode: assetMode,
      externalUrl: String(row.externalUrl || row.embedUrl || requestItem.externalUrl || requestItem.embedUrl || row.localPath || '').trim(),
    }
  }

  const file = resolveDriveFile_(row, requestItem)
  const blob = file.getBlob()
  const mimeType = blob.getContentType() || file.getMimeType()
  assertAllowedAssetMime_(type, mimeType, assetId)
  const name = file.getName()
  const extension = extensionFromNameOrMime_(name, mimeType)
  const bytes = blob.getBytes()

  return {
    pageId: String(row.pageId || requestItem.pageId || '').trim(),
    assetId: assetId,
    type: type,
    role: String(row.role || requestItem.role || '').trim(),
    fileName: name,
    extension: extension,
    mimeType: mimeType,
    size: bytes.length,
    base64: Utilities.base64Encode(bytes),
  }
}

function resolveDriveFile_(row, requestItem) {
  const driveFileId = String(row.driveFileId || requestItem.driveFileId || '').trim()
  if (driveFileId) return DriveApp.getFileById(driveFileId)

  const pageId = String(row.pageId || requestItem.pageId || '').trim()
  const fileName = String(row.fileName || row.driveFileName || requestItem.fileName || requestItem.driveFileName || '').trim()
  if (pageId && fileName) return firstFileByPageIdAndName_(pageId, fileName)

  const assetId = String(row.assetId || requestItem.assetId || '').trim()
  if (pageId && assetId) return firstFileByPageIdAndAssetId_(pageId, assetId)

  if (fileName) return firstFileByNameInRoot_(fileName)
  if (assetId) return firstFileByNameInRoot_(assetId)

  throw new Error('Asset must have driveFileId or pageId + fileName/assetId lookup value.')
}

function getAssetRootFolder_() {
  const configured = getProp_('DRIVE_ASSET_ROOT_FOLDER_ID')
  if (configured) return DriveApp.getFolderById(configured)
  return DriveApp.getRootFolder()
}

function firstPageFolder_(pageId) {
  const root = getAssetRootFolder_()
  const folders = root.getFoldersByName(pageId)
  if (!folders.hasNext()) throw new Error('Drive page folder not found: ' + pageId)
  return folders.next()
}

function firstFileByPageIdAndName_(pageId, fileName) {
  const folder = firstPageFolder_(pageId)
  const files = folder.getFilesByName(fileName)
  if (!files.hasNext()) throw new Error('Drive file not found: ' + pageId + '/' + fileName)
  return files.next()
}

function firstFileByPageIdAndAssetId_(pageId, assetId) {
  const folder = firstPageFolder_(pageId)
  const files = folder.getFiles()
  while (files.hasNext()) {
    const file = files.next()
    const name = file.getName()
    if (name === assetId || name.replace(/\.[^.]+$/, '') === assetId) return file
  }
  throw new Error('Drive file not found by assetId in page folder: ' + pageId + '/' + assetId)
}

function firstFileByNameInRoot_(name) {
  const files = getAssetRootFolder_().getFilesByName(name)
  if (!files.hasNext()) throw new Error('Drive root file not found by name: ' + name)
  return files.next()
}

function assertAllowedAssetMime_(type, mimeType, assetId) {
  const t = String(type || '').trim().toLowerCase()
  const m = String(mimeType || '').trim().toLowerCase()
  const image = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
  const video = ['video/mp4', 'video/webm']
  const file = ['application/pdf']
  const googleNativePrefix = 'application/vnd.google-apps.'
  if (m.indexOf(googleNativePrefix) === 0) throw new Error('Google-native file is not supported as asset: ' + assetId)
  if (t === 'image' && image.indexOf(m) === -1) throw new Error('Unsupported image MIME for ' + assetId + ': ' + m)
  if (t === 'video' && video.indexOf(m) === -1) throw new Error('Unsupported video MIME for ' + assetId + ': ' + m)
  if (t === 'file' && file.indexOf(m) === -1) throw new Error('Unsupported file MIME for ' + assetId + ': ' + m)
}

function requestPublish() {
  const ui = SpreadsheetApp.getUi()
  const lock = LockService.getDocumentLock()
  try {
    lock.waitLock(30000)
    const preflight = getPreflightResult_()
    if (!preflight.ok) {
      ui.alert('VARUNTOOLS 사전 검사 실패\n' + preflight.errors.join('\n'))
      return
    }
    const result = dispatchPublish_({})
    ui.alert('게시 요청을 보냈습니다.\nrequestId: ' + result.requestId)
  } catch (error) {
    ui.alert('게시 요청 실패\n' + error.message)
  } finally {
    try { lock.releaseLock() } catch (error) {}
  }
}

function dispatchPublish_(payload) {
  const token = getProp_('GITHUB_DISPATCH_TOKEN')
  const owner = getProp_('GITHUB_OWNER', 'earthroon')
  const repo = getProp_('GITHUB_REPO', 'varuntools')
  const eventType = getProp_('GITHUB_EVENT_TYPE', 'publish-sheet-content')
  if (!token) throw new Error('GITHUB_DISPATCH_TOKEN is not configured.')

  const now = new Date()
  const requestId = payload.requestId || createRequestId_(now)
  const requestedBy = Session.getActiveUser().getEmail() || 'unknown'
  const url = 'https://api.github.com/repos/' + owner + '/' + repo + '/dispatches'
  const body = {
    event_type: eventType,
    client_payload: {
      source: 'google-sheets-apps-script',
      requestedAt: now.toISOString(),
      requestedBy: requestedBy,
      requestId: requestId,
    },
  }

  appendPublishLog_({
    requestedAt: now,
    requestedBy: requestedBy,
    requestId: requestId,
    eventType: eventType,
    responseCode: '',
    responseBody: '',
    status: 'requested',
    message: 'Dispatch request created',
  })

  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json',
    },
    payload: JSON.stringify(body),
    muteHttpExceptions: true,
  })

  const code = response.getResponseCode()
  const ok = code >= 200 && code < 300
  appendPublishLog_({
    requestedAt: now,
    requestedBy: requestedBy,
    requestId: requestId,
    eventType: eventType,
    responseCode: code,
    responseBody: response.getContentText(),
    status: ok ? 'accepted' : 'failed',
    message: ok ? 'GitHub Actions dispatch accepted' : 'GitHub dispatch failed',
  })

  if (!ok) throw new Error('GitHub dispatch failed: ' + code)
  return { ok: true, requestId: requestId, responseCode: code }
}

function createRequestId_(now) {
  const tz = Session.getScriptTimeZone() || 'Asia/Seoul'
  const stamp = Utilities.formatDate(now, tz, 'yyyyMMdd_HHmmss')
  const rand = Math.random().toString(16).slice(2, 6)
  return 'pub_' + stamp + '_' + rand
}

function appendPublishLog_(entry) {
  const sheet = getPublishLogSheet_()
  if (!sheet) return
  sheet.appendRow([
    entry.requestedAt,
    entry.requestedBy,
    entry.requestId,
    entry.eventType,
    entry.responseCode,
    entry.responseBody,
    entry.actionRunUrl || '',
    entry.commitSha || '',
    entry.status,
    entry.message,
  ])
}

function getPreflightResult_() {
  const errors = []
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  REQUIRED_TABS.forEach(function (name) {
    if (!ss.getSheetByName(name)) errors.push(name + ' 시트를 찾을 수 없습니다.')
  })
  ;['SHEET_CMS_SHARED_SECRET', 'GITHUB_DISPATCH_TOKEN', 'GITHUB_OWNER', 'GITHUB_REPO', 'GITHUB_EVENT_TYPE'].forEach(function (key) {
    if (!getProp_(key)) errors.push(key + ' 설정이 없습니다.')
  })
  return { ok: errors.length === 0, errors: errors }
}

function runPreflightCheck() {
  const result = getPreflightResult_()
  SpreadsheetApp.getUi().alert(result.ok
    ? 'VARUNTOOLS 사전 검사 통과\n필수 시트와 설정이 확인되었습니다.'
    : 'VARUNTOOLS 사전 검사 실패\n' + result.errors.join('\n'))
}

function showConfigStatus() {
  const keys = ['SHEET_CMS_SHARED_SECRET', 'GITHUB_OWNER', 'GITHUB_REPO', 'GITHUB_EVENT_TYPE', 'GITHUB_DISPATCH_TOKEN', 'PUBLISH_LOG_SHEET', 'PUBLISHED_ARCHIVE_SHEET', 'DRIVE_ASSET_ROOT_FOLDER_ID']
  const lines = keys.map(function (key) { return key + ': ' + (getProp_(key) ? 'set' : 'missing') })
  SpreadsheetApp.getUi().alert('VARUNTOOLS 설정 확인\n' + lines.join('\n'))
}

function setupPropertiesOnce() {
  PropertiesService.getScriptProperties().setProperties({
    SHEET_CMS_SHARED_SECRET: 'REPLACE_WITH_LONG_RANDOM_SECRET',
    GITHUB_OWNER: 'earthroon',
    GITHUB_REPO: 'varuntools',
    GITHUB_EVENT_TYPE: 'publish-sheet-content',
    GITHUB_DISPATCH_TOKEN: 'REPLACE_WITH_GITHUB_TOKEN',
    PUBLISH_LOG_SHEET: 'publish_log',
    PUBLISHED_ARCHIVE_SHEET: 'published_archive',
    // Optional: set this if assets live under a specific Drive folder instead of My Drive root.
    // DRIVE_ASSET_ROOT_FOLDER_ID: 'OPTIONAL_FOLDER_ID',
  })
}


function finalizePublish_(payload) {
  const requestId = String(payload.requestId || '').trim()
  if (!requestId) throw new Error('finalize requires requestId.')

  const status = String(payload.status || 'success').trim().toLowerCase()
  const commitSha = String(payload.commitSha || '').trim()
  const actionRunUrl = String(payload.actionRunUrl || '').trim()
  const message = String(payload.message || (status === 'success' ? 'Publish finalized' : 'Publish failed')).trim()
  const pageIds = uniqueStrings_(payload.publishedPageIds || [])

  var cleanup = { pages: 0, blocks: 0, assets: 0 }
  var archiveRows = 0

  if (status === 'success') {
    const cleanupResult = archiveAndClearPublishedRows_(requestId, pageIds)
    cleanup = cleanupResult.clearedRows
    archiveRows = cleanupResult.archivedRows
    updatePublishLogByRequestId_({
      requestId: requestId,
      status: 'success',
      commitSha: commitSha,
      actionRunUrl: actionRunUrl,
      message: message + ' / cleanup rows: ' + archiveRows,
    })
  } else {
    updatePublishLogByRequestId_({
      requestId: requestId,
      status: status || 'failed',
      commitSha: commitSha,
      actionRunUrl: actionRunUrl,
      message: message,
    })
  }

  return {
    ok: true,
    source: 'apps-script-gateway',
    requestId: requestId,
    status: status,
    clearedRows: cleanup,
    archivedRows: archiveRows,
  }
}

function uniqueStrings_(values) {
  const seen = {}
  const out = []
  ;(values || []).forEach(function (value) {
    const text = String(value || '').trim()
    if (!text || seen[text]) return
    seen[text] = true
    out.push(text)
  })
  return out
}

function archiveAndClearPublishedRows_(requestId, pageIds) {
  const pageIdMap = {}
  pageIds.forEach(function (pageId) { pageIdMap[pageId] = true })
  const result = { clearedRows: { pages: 0, blocks: 0, assets: 0 }, archivedRows: 0 }
  if (!pageIds.length) return result

  const archive = ensurePublishedArchiveSheet_()
  ;['pages', 'blocks', 'assets'].forEach(function (sheetName) {
    const cleared = archiveAndClearSheetRows_(sheetName, pageIdMap, requestId, archive)
    result.clearedRows[sheetName] = cleared
    result.archivedRows += cleared
  })
  return result
}

function archiveAndClearSheetRows_(sheetName, pageIdMap, requestId, archiveSheet) {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const sheet = ss.getSheetByName(sheetName)
  if (!sheet) return 0
  const range = sheet.getDataRange()
  const values = range.getDisplayValues()
  if (values.length < 2) return 0

  const headers = (values[0] || []).map(function (header) { return String(header || '').trim() })
  const pageIdIndex = headers.indexOf('pageId')
  const visibleIndex = headers.indexOf('visible')
  const statusIndex = headers.indexOf('status')
  if (pageIdIndex === -1) return 0

  let cleared = 0
  for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    const row = values[rowIndex]
    const pageId = String(row[pageIdIndex] || '').trim()
    if (!pageIdMap[pageId]) continue

    const visible = visibleIndex >= 0 ? row[visibleIndex] : 'Y'
    if (!enabled_(visible)) continue

    if (sheetName === 'pages' && statusIndex >= 0) {
      const status = String(row[statusIndex] || '').trim().toLowerCase()
      if (['draft'].indexOf(status) !== -1) continue
    }

    const rowObject = {}
    headers.forEach(function (header, index) {
      if (header) rowObject[header] = row[index] || ''
    })

    archiveSheet.appendRow([
      new Date(),
      requestId,
      pageId,
      sheetName,
      rowIndex + 1,
      JSON.stringify(rowObject),
    ])
    sheet.getRange(rowIndex + 1, 1, 1, sheet.getLastColumn()).clearContent()
    cleared += 1
  }
  return cleared
}

function ensurePublishedArchiveSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const sheetName = getProp_('PUBLISHED_ARCHIVE_SHEET', 'published_archive')
  let sheet = ss.getSheetByName(sheetName)
  if (!sheet) sheet = ss.insertSheet(sheetName)
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['archivedAt', 'requestId', 'pageId', 'sourceSheet', 'sourceRowNumber', 'rowJson'])
  }
  return sheet
}

function updatePublishLogByRequestId_(entry) {
  const sheet = getPublishLogSheet_()
  if (!sheet) return
  const values = sheet.getDataRange().getDisplayValues()
  if (values.length === 0) {
    sheet.appendRow(['requestedAt', 'requestedBy', 'requestId', 'eventType', 'responseCode', 'responseBody', 'actionRunUrl', 'commitSha', 'status', 'message'])
  }
  const headers = sheet.getDataRange().getDisplayValues()[0].map(function (header) { return String(header || '').trim() })
  const requestIdIndex = headers.indexOf('requestId')
  let targetRow = -1
  if (requestIdIndex >= 0) {
    const rows = sheet.getDataRange().getDisplayValues()
    for (var index = rows.length - 1; index >= 1; index -= 1) {
      if (String(rows[index][requestIdIndex] || '').trim() === entry.requestId) {
        targetRow = index + 1
        break
      }
    }
  }

  if (targetRow === -1) {
    sheet.appendRow([
      new Date(),
      '',
      entry.requestId,
      getProp_('GITHUB_EVENT_TYPE', 'publish-sheet-content'),
      '',
      '',
      entry.actionRunUrl || '',
      entry.commitSha || '',
      entry.status || '',
      entry.message || '',
    ])
    return
  }

  setCellByHeader_(sheet, headers, targetRow, 'actionRunUrl', entry.actionRunUrl || '')
  setCellByHeader_(sheet, headers, targetRow, 'commitSha', entry.commitSha || '')
  setCellByHeader_(sheet, headers, targetRow, 'status', entry.status || '')
  setCellByHeader_(sheet, headers, targetRow, 'message', entry.message || '')
}

function getPublishLogSheet_() {
  const name = getProp_('PUBLISH_LOG_SHEET', 'publish_log')
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name)
}

function setCellByHeader_(sheet, headers, rowNumber, header, value) {
  const index = headers.indexOf(header)
  if (index === -1) return
  sheet.getRange(rowNumber, index + 1).setValue(value)
}

function openPublishLog() {
  const sheet = getPublishLogSheet_()
  if (!sheet) {
    SpreadsheetApp.getUi().alert('publish_log 시트를 찾을 수 없습니다.')
    return
  }
  SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(sheet)
}

function previewPublishedCleanup() {
  const ids = previewCleanupPageIds_()
  SpreadsheetApp.getUi().alert(
    ids.length
      ? '성공 발행 시 정리 후보 pageId:\n' + ids.join('\n')
      : '현재 정리 후보가 없습니다.'
  )
}

function previewCleanupPageIds_() {
  const out = {}
  ;['pages', 'blocks', 'assets'].forEach(function (sheetName) {
    const rows = getRowsByHeader_(sheetName)
    rows.forEach(function (row) {
      if (!enabled_(row.visible)) return
      if (sheetName === 'pages') {
        const status = String(row.status || '').trim().toLowerCase()
        if (status === 'draft') return
      }
      const pageId = String(row.pageId || '').trim()
      if (pageId) out[pageId] = true
    })
  })
  return Object.keys(out).sort()
}
