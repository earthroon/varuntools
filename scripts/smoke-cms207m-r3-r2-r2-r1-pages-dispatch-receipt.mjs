#!/usr/bin/env node
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const WRITER = path.join(HERE, 'write-vacms-pages-dispatch-receipt.mjs')
const SHA_A = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const SHA_B = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'

function runWriter(root, outcome) {
  return spawnSync(
    process.execPath,
    [WRITER, outcome],
    { cwd: root, encoding: 'utf8', shell: false },
  )
}

function writeState(root, state) {
  fs.writeFileSync(
    path.join(root, 'vacms-pages-dispatch-state.json'),
    JSON.stringify(state, null, 2) + '\n',
    'utf8',
  )
}

function withTemp(fn) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cms207m-r3-r2-r2-r1-'))
  try {
    return fn(root)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
}

function assertPhysicalReceipt(root, expected) {
  const receiptPath = path.join(root, 'vacms-pages-dispatch-receipt.json')
  const bytes = fs.readFileSync(receiptPath)

  assert.ok(bytes.length > 0)
  assert.equal(bytes[bytes.length - 1], 0x0A, 'receipt must end with physical LF')

  assert.notDeepEqual(
    Array.from(bytes.subarray(0, Math.min(3, bytes.length))),
    [0xEF, 0xBB, 0xBF],
    'receipt must not contain UTF-8 BOM',
  )

  const parsed = JSON.parse(bytes.toString('utf8'))
  assert.deepEqual(parsed, expected)

  const decoded = bytes.toString('utf8')
  assert.equal(decoded.endsWith('\\n'), false, 'receipt must not end with literal backslash+n')
}

withTemp((root) => {
  writeState(root, {
    sourceCommitted: true,
    sourceCommitSha: SHA_A,
  })

  const result = runWriter(root, 'dispatched')
  assert.equal(result.status, 0, result.stderr || result.stdout)
  assert.match(
    result.stdout,
    /PASS_CMS_207M_R3_R2_R2_R1_PAGES_DISPATCH_RECEIPT_PHYSICAL_JSON_AUTHORITY/,
  )

  assertPhysicalReceipt(root, {
    ok: true,
    dispatched: true,
    workflow: 'pages.yml',
    dispatchRef: 'main',
    sourceCommitSha: SHA_A,
  })
})

withTemp((root) => {
  writeState(root, {
    sourceCommitted: false,
    sourceCommitSha: SHA_B,
  })

  const result = runWriter(root, 'source-not-advanced')
  assert.equal(result.status, 0, result.stderr || result.stdout)

  assertPhysicalReceipt(root, {
    ok: true,
    dispatched: false,
    workflow: 'pages.yml',
    dispatchRef: 'main',
    sourceCommitSha: SHA_B,
    reason: 'source_not_advanced',
  })
})

function expectFailure({ state, rawState, outcome, code, omitState = false }) {
  withTemp((root) => {
    if (!omitState) {
      if (rawState !== undefined) {
        fs.writeFileSync(
          path.join(root, 'vacms-pages-dispatch-state.json'),
          rawState,
          'utf8',
        )
      } else {
        writeState(root, state)
      }
    }

    const result = runWriter(root, outcome)
    assert.notEqual(result.status, 0, `expected failure for ${code}`)
    assert.match(result.stderr, new RegExp(code))
    assert.equal(
      fs.existsSync(path.join(root, 'vacms-pages-dispatch-receipt.json')),
      false,
      'failed writer must not leave a dispatch receipt',
    )
  })
}

expectFailure({
  state: { sourceCommitted: true, sourceCommitSha: SHA_A },
  outcome: 'source-not-advanced',
  code: 'E_CMS207M_R3_R2_R2_R1_DISPATCH_OUTCOME_STATE_MISMATCH',
})

expectFailure({
  state: { sourceCommitted: false, sourceCommitSha: SHA_B },
  outcome: 'dispatched',
  code: 'E_CMS207M_R3_R2_R2_R1_DISPATCH_OUTCOME_STATE_MISMATCH',
})

expectFailure({
  state: { sourceCommitted: true, sourceCommitSha: 'bad-sha' },
  outcome: 'dispatched',
  code: 'E_CMS207M_R3_R2_R2_R1_SOURCE_COMMIT_SHA_INVALID',
})

expectFailure({
  state: { sourceCommitted: true, sourceCommitSha: SHA_A },
  outcome: 'unknown',
  code: 'E_CMS207M_R3_R2_R2_R1_DISPATCH_OUTCOME_INVALID',
})

expectFailure({
  omitState: true,
  outcome: 'dispatched',
  code: 'E_CMS207M_R3_R2_R2_R1_STATE_INVALID',
})

expectFailure({
  rawState: '{"sourceCommitted":true,',
  outcome: 'dispatched',
  code: 'E_CMS207M_R3_R2_R2_R1_STATE_INVALID',
})

console.log('PASS_CMS_207M_R3_R2_R2_R1_PAGES_DISPATCH_RECEIPT_PHYSICAL_JSON_SMOKE')
