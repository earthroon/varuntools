# Commit 119 migration note

## Commit

`feat(inquiry): add notification and reply workflow`

## Previous baseline

Commit 118 added the private admin inquiry review queue.

## Added

- notification payload and adapter contracts
- notification config environment variables
- notification event types
- Worker notification dispatcher after D1 storage success
- admin reply workflow panel
- reply template registry
- manual reply checklist
- `smoke:inquiry-notification-workflow`

## Not changed

- Google Form fallback remains available.
- Worker-first intake migration is not performed.
- Public customer inquiry lookup is not added.
- Automatic email/Slack/Discord delivery is not enabled.

## Required before enabling external delivery

- choose a real delivery provider
- configure webhook/recipient secrets in Cloudflare
- verify privacy policy for external notification payloads
- decide whether reply completion should create `reply-sent-manually` events automatically or remain note-based
