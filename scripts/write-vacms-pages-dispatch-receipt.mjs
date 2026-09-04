#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const ROOT = process.cwd()
const STATE_FILE = path.join(ROOT, 'vacms-pages-dispatch-state.json')
const RECEIPT_FILE = path.join(ROOT, 'vacms-pages-dispatch-receipt.json')
const TEMP_FILE = path.join(ROOT, `vacms-pages-dispatch-receipt.json.tmp.${process.pid}`)
const outcome = String(process.argv[2] || '').trim()

class DispatchReceiptError extends Error {
  constructor(code, message, details = {}) {
    super(message)
    this.name = 'DispatchReceiptError'
    this.code = code
    this.details = details
  }
}

function fail(code, message, details = {}) {
  throw new DispatchReceiptError(code, message, details)
}

function cleanup() {
  fs.rmSync(TEMP_FILE, { force: true })
}

function readState() {
  if (!fs.existsSync(STATE_FILE)) {
    fail(
      'E_CMS207M_R3_R2_R2_R1_STATE_INVALID',
      'vacms-pages-dispatch-state.json is missing.',
    )
  }

  let state
  try {
    state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))
  } catch (error) {
    fail(
      'E_CMS207M_R3_R2_R2_R1_STATE_INVALID',
      'vacms-pages-dispatch-state.json is not valid JSON.',
      { detail: error instanceof Error ? error.message : String(error) },
    )
  }

  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    fail(
      'E_CMS207M_R3_R2_R2_R1_STATE_INVALID',
      'Dispatch state must be a JSON object.',
    )
  }

  if (typeof state.sourceCommitted !== 'boolean') {
    fail(
      'E_CMS207M_R3_R2_R2_R1_STATE_INVALID',
      'sourceCommitted must be boolean.',
      { actualType: typeof state.sourceCommitted },
    )
  }

  const sourceCommitSha = String(state.sourceCommitSha || '').trim()
  if (!/^[0-9a-f]{40}$/.test(sourceCommitSha)) {
    fail(
      'E_CMS207M_R3_R2_R2_R1_SOURCE_COMMIT_SHA_INVALID',
      'sourceCommitSha must be an exact 40-character lowercase Git SHA.',
      { sourceCommitSha },
    )
  }

  return {
    sourceCommitted: state.sourceCommitted,
    sourceCommitSha,
  }
}

function validateOutcome(state) {
  if (outcome !== 'dispatched' && outcome !== 'source-not-advanced') {
    fail(
      'E_CMS207M_R3_R2_R2_R1_DISPATCH_OUTCOME_INVALID',
      'Outcome must be dispatched or source-not-advanced.',
      { outcome },
    )
  }

  if (outcome === 'dispatched' && state.sourceCommitted !== true) {
    fail(
      'E_CMS207M_R3_R2_R2_R1_DISPATCH_OUTCOME_STATE_MISMATCH',
      'dispatched outcome requires sourceCommitted=true.',
    )
  }

  if (outcome === 'source-not-advanced' && state.sourceCommitted !== false) {
    fail(
      'E_CMS207M_R3_R2_R2_R1_DISPATCH_OUTCOME_STATE_MISMATCH',
      'source-not-advanced outcome requires sourceCommitted=false.',
    )
  }
}

function buildReceipt(state) {
  if (outcome === 'dispatched') {
    return {
      ok: true,
      dispatched: true,
      workflow: 'pages.yml',
      dispatchRef: 'main',
      sourceCommitSha: state.sourceCommitSha,
    }
  }

  return {
    ok: true,
    dispatched: false,
    workflow: 'pages.yml',
    dispatchRef: 'main',
    sourceCommitSha: state.sourceCommitSha,
    reason: 'source_not_advanced',
  }
}

function validatePhysical(bytes, expectedReceipt, phase) {
  if (!Buffer.isBuffer(bytes) || bytes.length === 0) {
    fail(
      'E_CMS207M_R3_R2_R2_R1_RECEIPT_READBACK_INVALID_JSON',
      `${phase} receipt bytes are empty.`,
    )
  }

  if (
    bytes.length >= 3
    && bytes[0] === 0xEF
    && bytes[1] === 0xBB
    && bytes[2] === 0xBF
  ) {
    fail(
      'E_CMS207M_R3_R2_R2_R1_RECEIPT_BOM_FORBIDDEN',
      `${phase} receipt must not contain a UTF-8 BOM.`,
    )
  }

  if (bytes[bytes.length - 1] !== 0x0A) {
    fail(
      'E_CMS207M_R3_R2_R2_R1_RECEIPT_PHYSICAL_NEWLINE_INVALID',
      `${phase} receipt must end with one physical LF byte.`,
      { finalByte: bytes[bytes.length - 1] },
    )
  }

  let parsed
  try {
    parsed = JSON.parse(bytes.toString('utf8'))
  } catch (error) {
    fail(
      'E_CMS207M_R3_R2_R2_R1_RECEIPT_READBACK_INVALID_JSON',
      `${phase} receipt is not valid JSON.`,
      { detail: error instanceof Error ? error.message : String(error) },
    )
  }

  const semanticMatch =
    parsed
    && typeof parsed === 'object'
    && !Array.isArray(parsed)
    && parsed.ok === true
    && parsed.dispatched === expectedReceipt.dispatched
    && parsed.workflow === 'pages.yml'
    && parsed.dispatchRef === 'main'
    && parsed.sourceCommitSha === expectedReceipt.sourceCommitSha
    && (
      expectedReceipt.dispatched === true
        ? !Object.prototype.hasOwnProperty.call(parsed, 'reason')
        : parsed.reason === 'source_not_advanced'
    )

  if (!semanticMatch) {
    fail(
      'E_CMS207M_R3_R2_R2_R1_RECEIPT_SEMANTIC_READBACK_MISMATCH',
      `${phase} receipt semantic readback does not match the expected dispatch state.`,
      { parsed, expectedReceipt },
    )
  }

  return parsed
}

function writeReceipt(receipt) {
  const bytes = Buffer.from(JSON.stringify(receipt, null, 2) + '\n', 'utf8')

  try {
    fs.writeFileSync(TEMP_FILE, bytes)
  } catch (error) {
    fail(
      'E_CMS207M_R3_R2_R2_R1_RECEIPT_WRITE_FAILED',
      'Failed to write temporary dispatch receipt.',
      { detail: error instanceof Error ? error.message : String(error) },
    )
  }

  const tempBytes = fs.readFileSync(TEMP_FILE)
  validatePhysical(tempBytes, receipt, 'temporary')

  try {
    fs.renameSync(TEMP_FILE, RECEIPT_FILE)
  } catch (error) {
    fail(
      'E_CMS207M_R3_R2_R2_R1_RECEIPT_WRITE_FAILED',
      'Failed to atomically promote dispatch receipt.',
      { detail: error instanceof Error ? error.message : String(error) },
    )
  }

  const physicalBytes = fs.readFileSync(RECEIPT_FILE)
  validatePhysical(physicalBytes, receipt, 'physical')

  if (!physicalBytes.equals(bytes)) {
    fail(
      'E_CMS207M_R3_R2_R2_R1_RECEIPT_SEMANTIC_READBACK_MISMATCH',
      'Physical receipt bytes differ from the serialized receipt bytes.',
    )
  }
}

try {
  cleanup()
  fs.rmSync(RECEIPT_FILE, { force: true })

  const state = readState()
  validateOutcome(state)
  const receipt = buildReceipt(state)
  writeReceipt(receipt)

  console.log('PASS_CMS_207M_R3_R2_R2_R1_PAGES_DISPATCH_RECEIPT_PHYSICAL_JSON_AUTHORITY')
  console.log(`outcome=${outcome}`)
  console.log(`sourceCommitSha=${state.sourceCommitSha}`)
} catch (error) {
  cleanup()
  fs.rmSync(RECEIPT_FILE, { force: true })

  const code =
    error && typeof error === 'object' && typeof error.code === 'string'
      ? error.code
      : 'E_CMS207M_R3_R2_R2_R1_RECEIPT_WRITE_FAILED'
  const message = error instanceof Error ? error.message : String(error)

  console.error(`${code}: ${message}`)
  if (error && typeof error === 'object' && error.details) {
    console.error(JSON.stringify(error.details))
  }
  process.exit(1)
}
