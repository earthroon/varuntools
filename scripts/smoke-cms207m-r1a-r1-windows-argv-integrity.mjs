#!/usr/bin/env node
import assert from 'node:assert/strict'
import fs from 'node:fs'

const file = 'scripts/commit-vacms-materialized-source.mjs'
const source = fs.readFileSync(file, 'utf8')

assert.doesNotMatch(source, /shell:\s*process\.platform\s*===\s*['"]win32['"]/, 'git child processes must not enter a Windows command shell')
assert.doesNotMatch(source, /shell:\s*true/, 'git child processes must preserve argv without shell parsing')
assert.match(source, /spawnSync\(command, args, \{[\s\S]*?shell:\s*false/, 'run() must pass git argv directly')
assert.match(source, /spawnSync\(['"]git['"], \[['"]config['"], ['"]user\.name['"]\], \{ encoding: ['"]utf8['"], shell: false \}\)/)
assert.match(source, /spawnSync\(['"]git['"], \[['"]config['"], ['"]user\.email['"]\], \{ encoding: ['"]utf8['"], shell: false \}\)/)
assert.match(source, /run\(['"]git['"], \[['"]commit['"], ['"]-m['"], `publish: persist VACMS page \$\{safeSlugForMessage\}`\]/)

console.log('PASS_CMS_207M_R1A_R1_WINDOWS_ARGV_INTEGRITY')
