# CMS-204AO-R1 Markdown Page Registry Inclusion For Live Materialized Route

## SSOT

CMS-204AO seals the post-build runtime registry layer for live materialized VACMS pages.

The publish chain may successfully materialize, build, push to `gh-pages`, and finalize while the public route still renders a not-found page if the live materialized slug is not present in the built Markdown page lookup bundle.

## Scope

- Add a workflow step after `npm run build` and before live deploy.
- Verify `vacms-materialization-receipt.json`.
- Verify the generated markdown source exists.
- Verify the markdown frontmatter slug matches the materialized route slug.
- Verify `dist/assets/pageLookup-*.js` contains the materialized slug.
- Reject sitemap/search-only inclusion.
- Upload `vacms-page-registry-receipt.json` with publish artifacts.

## Runtime receipt

The workflow writes:

```txt
vacms-page-registry-receipt.json
```

PASS status:

```txt
PASS_CMS_204AO_R1_MARKDOWN_PAGE_REGISTRY_INCLUSION_GUARD_FIX_SEAL
```

## Non-goals

- No force push.
- No manual generated dist patching.
- No VACMS Worker mutation.
- No D1 schema mutation.
- No weakening CMS-204AL, CMS-204AM, or CMS-204AN gates.


## R1 note

R1 narrows the no-force-push static guard to actual `git push` commands only. Cleanup commands such as `git worktree remove --force` are not treated as force pushes.
