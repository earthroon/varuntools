#!/usr/bin/env node
import fs from 'node:fs'

function fail(message) {
  console.error('[CMS207A_HOMEPAGE_PUBLIC_REGISTRY_INCLUSION_FAIL]', message)
  process.exit(1)
}

const commitScript = fs.readFileSync('scripts/commit-vacms-materialized-source.mjs', 'utf8')
const guard = fs.readFileSync('scripts/cms-204ao-markdown-page-registry-inclusion-guard.mjs', 'utf8')
const registryBuilder = fs.readFileSync('scripts/build-vacms-live-markdown-registry.mjs', 'utf8')

if (!commitScript.includes('publicListingInclusionExpected')) fail('source commit receipt must state public listing inclusion expectation')
if (!commitScript.includes('src/markdown/vacmsLivePages.generated.ts')) fail('one-shot live registry source guard path is missing')
if (!commitScript.includes('CMS_207A_ONE_SHOT_REGISTRY_SOURCE_COMMIT_BLOCKED')) fail('one-shot live registry commit block is missing')
if (!guard.includes('sourceFileExists')) fail('registry inclusion guard must check source file existence')
if (!guard.includes('sourceSlugAligned')) fail('registry inclusion guard must check source slug alignment')
if (!guard.includes('CMS_204AO_SOURCE_SLUG_MISMATCH')) fail('registry inclusion guard must block slug mismatch')
if (!guard.includes('CMS_204AQ_AP_REBIND_RECEIPT_MISSING')) fail('registry inclusion guard must require AP registry rebind evidence')
if (!registryBuilder.includes('vacmsLiveMarkdownPageSources')) fail('live markdown registry builder must produce VACMS live source registry')

console.log('CMS207A_HOMEPAGE_PUBLIC_REGISTRY_INCLUSION_PASS')
