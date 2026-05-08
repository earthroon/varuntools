# Grant Reissue Dry-run

Reissue dry-run checks whether a replacement grant could be planned in a future write-enabled commit. It does not create a new grant.

## Candidate reasons

- delivery-incident
- grant-expired with valid support approval
- download-limit review
- wrong deliverable set investigation

## Blockers

- refunded order
- revoked fraud-suspected grant
- unknown productSlug
- requested deliverables outside the original entitlement
- missing variant/bundle context for variant-level purchase

Confirm the phrase `REISSUE GRANT`.

## Commit 80 status

Runtime reissue is unsupported. The dry-run must preserve the original entitlement scope.
