# CMS-204AM

## Gh Pages Remote Ref Rebase Before Deploy / Non Fast Forward Push Guard Seal

### SSOT

`release:pages --push` now reaches `scripts/deploy-pages-branch.mjs`, but the deployment can still fail when the local `gh-pages` worktree is not based on the latest `origin/gh-pages`. The observed failure is a `non-fast-forward` rejection during `git push origin gh-pages`.

### Change

CMS-204AM changes `scripts/deploy-pages-branch.mjs` so the deploy worktree is remote-first:

1. Detect whether `origin/gh-pages` exists.
2. If it exists, read its SHA and fetch it into `refs/remotes/origin/gh-pages`.
3. Create/reset the local deploy worktree from `origin/gh-pages`:
   `git worktree add -B gh-pages <worktree> origin/gh-pages`.
4. Only if the remote deploy branch does not exist, create the deploy worktree from `HEAD`.
5. Preserve CMS-204AL push evidence.
6. Extend `vacms-pages-deploy-evidence.json` with `remoteDeployBranchExists`, `remoteBaseSha`, and `localDeploySha`.
7. Do not introduce force push.

### Acceptance

CMS-204AM passes only when:

- deploy worktree starts from `origin/gh-pages` when that remote branch exists;
- `git fetch origin gh-pages:refs/remotes/origin/gh-pages` runs before worktree creation;
- local `gh-pages` is not trusted as the deploy base;
- push failure remains a hard failure;
- CMS-204AL success finalize gate remains strict;
- no force push is introduced.
