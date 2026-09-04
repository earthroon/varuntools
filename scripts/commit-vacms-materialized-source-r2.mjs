#!/usr/bin/env node
import fs from 'node:fs'
import process from 'node:process'
import { spawnSync } from 'node:child_process'

const PASS = 'PASS_CMS_207M_R2_PUBLIC_MATERIALIZATION_CONTRACT_AUTHORITY_CLOSURE'
const ADMISSION = 'vacms-materialization-admission.json'
const MATERIALIZATION = 'vacms-materialization-receipt.json'

function fail(code, message) {
  console.error(code + ': ' + message)
  process.exit(1)
}

function readJson(file, code) {
  if (!fs.existsSync(file)) fail(code, file + ' is missing')

  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (error) {
    fail(code, error instanceof Error ? error.message : String(error))
  }
}

const admission = readJson(
  ADMISSION,
  'E_CMS207M_R2_ADMISSION_RECEIPT_INVALID',
)
const materialization = readJson(
  MATERIALIZATION,
  'E_CMS207M_R2_MATERIALIZATION_RECEIPT_INVALID',
)

if (
  admission.ok !== true
  || admission.status !== PASS
  || admission.candidateContractPassed !== true
  || admission.wholeRepoValidationPassed !== true
  || admission.mainMutationAllowed !== true
) {
  fail(
    'E_CMS207M_R2_COMMIT_WITHOUT_ADMISSION',
    'source commit requires a fully authorized CMS-207M-R2 admission receipt',
  )
}

const admissionPath = String(admission.generatedPath || '')
const materializationPath = String(materialization.generatedPath || '')

if (!admissionPath || admissionPath !== materializationPath) {
  fail(
    'E_CMS207M_R2_ADMISSION_CANDIDATE_MISMATCH',
    'admission.generatedPath does not match materialization.generatedPath',
  )
}

if (!fs.existsSync(admissionPath)) {
  fail('E_CMS207M_R2_ADMISSION_CANDIDATE_MISSING', admissionPath)
}

const currentSize = fs.statSync(admissionPath).size
if (
  typeof admission.candidateByteLength !== 'number'
  || admission.candidateByteLength !== currentSize
) {
  fail(
    'E_CMS207M_R2_ADMISSION_CANDIDATE_SIZE_MISMATCH',
    'candidate byte length changed after admission',
  )
}

const admissionHash = String(admission.contentHash || '')
const materializationHash = String(materialization.contentHash || '')

if (
  admissionHash
  && materializationHash
  && admissionHash !== materializationHash
) {
  fail(
    'E_CMS207M_R2_ADMISSION_RECEIPT_HASH_IDENTITY_MISMATCH',
    'admission receipt identity differs from materialization receipt identity',
  )
}

if (
  admission.pageId
  && materialization.pageId
  && admission.pageId !== materialization.pageId
) {
  fail(
    'E_CMS207M_R2_ADMISSION_PAGE_ID_MISMATCH',
    'admission pageId differs from materialization pageId',
  )
}

if (
  admission.revisionId
  && materialization.revisionId
  && admission.revisionId !== materialization.revisionId
) {
  fail(
    'E_CMS207M_R2_ADMISSION_REVISION_ID_MISMATCH',
    'admission revisionId differs from materialization revisionId',
  )
}

const result = spawnSync(
  process.execPath,
  ['scripts/commit-vacms-materialized-source.mjs', '--workflow'],
  {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: false,
  },
)

if (result.error) {
  fail(
    'E_CMS207M_R2_DELEGATE_EXECUTION_FAILED',
    result.error instanceof Error
      ? result.error.message
      : String(result.error),
  )
}

process.exit(result.status ?? 1)
