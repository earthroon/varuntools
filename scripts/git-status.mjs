#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import process from 'node:process'

function git(args, options = {}) {
  const result = spawnSync('git', args, {
    encoding: 'utf8',
    shell: process.platform === 'win32',
    ...options,
  })
  return result
}

function requireGit(args, label) {
  const result = git(args)
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || '').trim()
    throw new Error(`[git] ${label} failed${detail ? `: ${detail}` : ''}`)
  }
  return result.stdout.trim()
}

try {
  const inside = requireGit(['rev-parse', '--is-inside-work-tree'], 'repository check')
  if (inside !== 'true') throw new Error('[git] not inside a git work tree')

  const branch = requireGit(['rev-parse', '--abbrev-ref', 'HEAD'], 'branch check')
  const porcelain = requireGit(['status', '--porcelain'], 'status check')
  const changed = porcelain.split('\n').filter((line) => line && !line.startsWith('??')).length
  const untracked = porcelain.split('\n').filter((line) => line.startsWith('??')).length
  const lastCommit = requireGit(['log', '-1', '--pretty=format:%h %s'], 'last commit check')

  console.log(`[git] branch: ${branch}`)
  console.log(`[git] status: ${porcelain ? 'dirty' : 'clean'}`)
  console.log(`[git] changed files: ${changed}`)
  console.log(`[git] untracked files: ${untracked}`)
  console.log(`[git] last commit: ${lastCommit}`)
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
