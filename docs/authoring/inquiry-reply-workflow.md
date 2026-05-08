# Inquiry reply workflow

Commit 119 adds manual reply support to the private admin inquiry detail panel.

## Scope

- reply template registry
- reply template preview
- copyable manual reply draft
- manual reply checklist
- status transition guide

## Not automated

This commit does not send email, Slack, Discord, or CRM messages automatically. Operators copy a prepared reply, answer through the chosen external channel, then update the inquiry state in the admin queue.

## Recommended status flow

```txt
new -> triaged -> in-progress -> waiting-reply -> closed
```

Use `waiting-reply` when the operator needs more information from the requester. Use `closed` only after the manual response path has been completed or the inquiry is intentionally out of scope.
