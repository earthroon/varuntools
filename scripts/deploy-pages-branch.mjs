#!/usr/bin/env node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import process from 'node:process'

const SOURCE_BRANCH = 'main'
const DEPLOY_BRANCH = 'gh-pages'
const CUSTOM_DOMAIN = 'varun.tools'
const PAGES_FOLDER = '/'

const args = new Set(process.argv.slice(2))
const shouldPush = args.has('--push')
const dryRun = args.has('--dry-run')
const skipPrepare = args.has('--skip-prepare')

function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    encoding: options.encoding ?? 'utf8',
    stdio: options.stdio ?? 'pipe',
    shell: process.platform === 'win32',
    ...options,
  })

  if (result.status !== 0) {
    const detail = [result.stdout, result.stderr].filter(Boolean).join('\n').trim()
    throw new Error(`[release:pages] command failed: ${command} ${commandArgs.join(' ')}${detail ? `\n${detail}` : ''}`)
  }

  return result.stdout?.trim?.() ?? ''
}

function runInherited(command, commandArgs, label) {
  console.log(`[release:pages] running ${label}`)
  const result = spawnSync(command, commandArgs, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  if (result.status !== 0) throw new Error(`[release:pages] FAILED ${label}`)
  console.log(`[release:pages] OK ${label}`)
}

function ensureGitRepo() {
  const inside = run('git', ['rev-parse', '--is-inside-work-tree'])
  if (inside !== 'true') throw new Error('[release:pages] not inside a git work tree')
}

function getCurrentBranch() {
  return run('git', ['rev-parse', '--abbrev-ref', 'HEAD'])
}

function branchExists(branch) {
  const result = spawnSync('git', ['show-ref', '--verify', '--quiet', `refs/heads/${branch}`], {
    shell: process.platform === 'win32',
  })
  return result.status === 0
}

function removeContentsExceptGit(dir) {
  for (const entry of fs.readdirSync(dir)) {
    if (entry === '.git') continue
    fs.rmSync(path.join(dir, entry), { recursive: true, force: true })
  }
}

function copyDirContents(source, target) {
  fs.mkdirSync(target, { recursive: true })
  for (const entry of fs.readdirSync(source)) {
    fs.cpSync(path.join(source, entry), path.join(target, entry), { recursive: true })
  }
}

function gitWorktreeList() {
  try {
    return run('git', ['worktree', 'list', '--porcelain'])
  } catch {
    return ''
  }
}

function cleanupWorktree(worktreePath) {
  try {
    const list = gitWorktreeList()
    if (list.includes(worktreePath)) {
      run('git', ['worktree', 'remove', '--force', worktreePath])
    } else if (fs.existsSync(worktreePath)) {
      fs.rmSync(worktreePath, { recursive: true, force: true })
    }
  } catch {
    if (fs.existsSync(worktreePath)) fs.rmSync(worktreePath, { recursive: true, force: true })
  }
}

try {
  console.log(`[release:pages] source branch: ${SOURCE_BRANCH}`)
  console.log(`[release:pages] deploy branch: ${DEPLOY_BRANCH}`)
  console.log(`[release:pages] pages folder: ${PAGES_FOLDER} root`)
  console.log(`[release:pages] custom domain: ${CUSTOM_DOMAIN}`)

  if (!dryRun) {
    ensureGitRepo()
    const currentBranch = getCurrentBranch()
    if (currentBranch !== SOURCE_BRANCH) {
      throw new Error(`[release:pages] current branch must be ${SOURCE_BRANCH}; got ${currentBranch}`)
    }
  }

  if (!skipPrepare) runInherited('node', ['scripts/release-prepare.mjs'], 'release:prepare')

  const distDir = path.resolve(process.cwd(), 'dist')
  if (!fs.existsSync(path.join(distDir, 'index.html'))) {
    throw new Error('[release:pages] dist/index.html not found; run npm run release:prepare first')
  }

  if (dryRun) {
    const previewDir = path.join(process.cwd(), 'tmp', 'gh-pages-dry-run')
    fs.rmSync(previewDir, { recursive: true, force: true })
    copyDirContents(distDir, previewDir)
    fs.writeFileSync(path.join(previewDir, '.nojekyll'), '', 'utf8')
    fs.writeFileSync(path.join(previewDir, 'CNAME'), `${CUSTOM_DOMAIN}\n`, 'utf8')
    console.log(`[release:pages] dry run wrote ${path.relative(process.cwd(), previewDir)}`)
    console.log('[release:pages] dry run did not switch branches, commit, or push')
    process.exit(0)
  }

  const worktreeRoot = path.join(os.tmpdir(), `varuntools-${DEPLOY_BRANCH}-${Date.now()}`)
  cleanupWorktree(worktreeRoot)

  if (branchExists(DEPLOY_BRANCH)) {
    run('git', ['worktree', 'add', worktreeRoot, DEPLOY_BRANCH])
  } else {
    run('git', ['worktree', 'add', '-B', DEPLOY_BRANCH, worktreeRoot, 'HEAD'])
  }

  try {
    removeContentsExceptGit(worktreeRoot)
    copyDirContents(distDir, worktreeRoot)
    fs.writeFileSync(path.join(worktreeRoot, '.nojekyll'), '', 'utf8')
    fs.writeFileSync(path.join(worktreeRoot, 'CNAME'), `${CUSTOM_DOMAIN}\n`, 'utf8')

    run('git', ['-C', worktreeRoot, 'add', '-A'])
    const status = run('git', ['-C', worktreeRoot, 'status', '--porcelain'])
    if (!status) {
      console.log('[release:pages] no deploy changes to commit')
    } else {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-')
      run('git', ['-C', worktreeRoot, 'commit', '-m', `deploy: github pages ${stamp}`], { stdio: 'inherit' })
      console.log(`[release:pages] committed ${DEPLOY_BRANCH} deployment`)
    }

    if (shouldPush) {
      run('git', ['-C', worktreeRoot, 'push', 'origin', DEPLOY_BRANCH], { stdio: 'inherit' })
      console.log(`[release:pages] pushed origin ${DEPLOY_BRANCH}`)
    } else {
      console.log(`[release:pages] push skipped; run: git push origin ${DEPLOY_BRANCH}`)
    }
  } finally {
    cleanupWorktree(worktreeRoot)
  }

  console.log('[release:pages] OK GitHub Pages deployment branch prepared')
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
