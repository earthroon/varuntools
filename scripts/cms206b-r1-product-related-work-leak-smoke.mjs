#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const file = path.join(root, 'src/markdown/pageRegistry.ts')
const text = fs.readFileSync(file, 'utf8')

function assert(condition, message) {
  if (!condition) {
    console.error('[CMS-206B-R1] FAIL ' + message)
    process.exit(1)
  }
}

assert(text.includes("const WORK_DETAIL_ALLOWED_KINDS = new Set(['work', 'case-study'])"), 'WORK_DETAIL_ALLOWED_KINDS must be work/case-study only')
assert(text.includes("const WORK_DETAIL_ALLOWED_CATEGORIES = new Set(['works', 'work', 'case-study'])"), 'WORK_DETAIL_ALLOWED_CATEGORIES must be works/work/case-study only')
assert(text.includes('function isWorkDetailEligible(entry: WorkCardEntry): boolean'), 'isWorkDetailEligible helper must exist')
assert(text.includes('.filter(isWorkDetailEligible),'), 'getVisibleWorkEntries must use isWorkDetailEligible')
assert(!text.includes('.filter(isDetailEligible),'), 'getVisibleWorkEntries must not directly use broad isDetailEligible filter')
assert(!/WORK_DETAIL_ALLOWED_KINDS[^\n]*page/.test(text), 'page must not be in work detail allowed kinds')
assert(!/WORK_DETAIL_ALLOWED_KINDS[^\n]*post/.test(text), 'post must not be in work detail allowed kinds')
assert(!/WORK_DETAIL_ALLOWED_KINDS[^\n]*product/.test(text), 'product must not be in work detail allowed kinds')
assert(!/WORK_DETAIL_ALLOWED_KINDS[^\n]*lab/.test(text), 'lab must not be in work detail allowed kinds')
assert(!/WORK_DETAIL_ALLOWED_KINDS[^\n]*tool/.test(text), 'tool must not be in work detail allowed kinds')

console.log('CMS206B_R1_PRODUCT_RELATED_WORK_LEAK_BLOCK_PASS')
