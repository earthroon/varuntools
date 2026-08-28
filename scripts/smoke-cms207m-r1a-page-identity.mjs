#!/usr/bin/env node
import assert from 'node:assert/strict'
import {
  classifyVacmsPageTransition,
  isSafeVacmsPagePath,
  validateTargetPathOwnership,
} from './lib/cms207m-r1a-page-identity.mjs'

const old = {
  path: 'src/content/pages/post/alpha/index.md',
  source: 'vacms',
  pageId: 'page_a',
  revisionId: 'rev_1',
  content: 'old',
}

assert.equal(classifyVacmsPageTransition({
  predecessors: [],
  incomingPath: 'src/content/pages/post/alpha/index.md',
  incomingRevisionId: 'rev_1',
}).transition, 'first_publish')

assert.equal(classifyVacmsPageTransition({
  predecessors: [old],
  incomingPath: old.path,
  incomingRevisionId: 'rev_2',
  currentContent: 'new',
}).transition, 'in_place_revision_replacement')

assert.equal(classifyVacmsPageTransition({
  predecessors: [old],
  incomingPath: 'src/content/pages/post/beta/index.md',
  incomingRevisionId: 'rev_2',
  currentContent: 'new',
}).transition, 'route_move')

assert.equal(classifyVacmsPageTransition({
  predecessors: [{ ...old, content: 'same' }],
  incomingPath: old.path,
  incomingRevisionId: 'rev_1',
  currentContent: 'same',
}).transition, 'idempotent_noop')

assert.equal(isSafeVacmsPagePath('src/content/pages/post/alpha/index.md'), true)
assert.equal(isSafeVacmsPagePath('../src/content/pages/post/alpha/index.md'), false)

assert.throws(() => classifyVacmsPageTransition({
  predecessors: [old, { ...old, path: 'src/content/pages/post/dup/index.md' }],
  incomingPath: old.path,
  incomingRevisionId: 'rev_2',
}), /Multiple live public paths/)

assert.throws(() => classifyVacmsPageTransition({
  predecessors: [{ ...old, content: 'old' }],
  incomingPath: old.path,
  incomingRevisionId: 'rev_1',
  currentContent: 'drift',
}), /same VACMS revision produced different public Markdown bytes/i)

assert.doesNotThrow(() => validateTargetPathOwnership(old, 'page_a', old.path))
assert.throws(() => validateTargetPathOwnership({ ...old, pageId: 'page_b' }, 'page_a', old.path), /another VACMS page/)
assert.throws(() => validateTargetPathOwnership({ ...old, source: 'repository', pageId: '' }, 'page_a', old.path), /repository-authored/)

console.log('PASS_CMS_207M_R1A_PAGE_ID_IDENTITY_SSOT_SMOKE')
