# CMS-204AN-R3 Public Markdown RoutePath Slug Alignment / Receipt Fix

## SSOT

Public runtime route lookup uses the materialized markdown `frontmatter.slug`. VACMS publish must make that slug match `snapshot.routePath` when a route path is present.

## Fixed failure

CMS-204AN-R1 could fail on a partial application where `materializedSlug` existed but `slugSource` was not present in `vacms-materialization-receipt.json`. R2 canonicalizes the materialization receipt block instead of relying on a fragile adjacent-line anchor.

## Rule

- `/page/sdsdsd` becomes `slug: "page/sdsdsd"`.
- The original CMS slug is preserved as `vacmsSlug`.
- The materialization receipt includes `materializedSlug`, `vacmsSlug`, `generatedPathSlug`, and `slugSource`.
- Force push remains forbidden, but cleanup commands such as `git worktree remove --force` are not treated as force push.

## PASS

`PASS_CMS_204AN_R3_PUBLIC_MARKDOWN_ROUTEPATH_SLUG_ALIGNMENT_WINDOWS_FILEURL_FIX_SEAL`
