#!/usr/bin/env node
import fs from 'node:fs'

const PASS_STATUS = 'PASS_CMS_207C_NO_SPA_ONLY_PUBLISH'
const workflowPath = '.github/workflows/publish-admin-content.yml'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const workflow = fs.readFileSync(workflowPath, 'utf8')
const buildIndex = workflow.indexOf('npm run build')
const materializeIndex = workflow.indexOf('node scripts/materialize-static-routes.mjs --workflow')
const guardIndex = workflow.indexOf('node scripts/cms207c-static-route-materialization-guard.mjs --workflow')
const releaseIndex = workflow.indexOf('npm run release:pages -- --push --skip-prepare')
const readbackIndex = workflow.indexOf('node scripts/cms207c-gh-pages-static-route-readback-smoke.mjs --workflow')
const finalizeIndex = workflow.indexOf('- name: Finalize live public site deploy')

assert(buildIndex >= 0, 'workflow missing npm run build')
assert(materializeIndex > buildIndex, 'static route materialization must run after build')
assert(guardIndex > materializeIndex, 'static route guard must run after materialization')
assert(releaseIndex > guardIndex, 'release:pages must run after static route guard')
assert(readbackIndex > releaseIndex, 'gh-pages readback must run after release:pages')
assert(finalizeIndex > readbackIndex, 'finalize must run after gh-pages static route readback')

console.log(PASS_STATUS)
