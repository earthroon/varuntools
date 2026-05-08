# Admin Inquiry Review Queue

Commit 118 adds a private admin review queue for inquiries stored by the D1 inquiry storage model from Commit 117.

## Boundary

This surface is for internal review only.

- Public customer inquiry lookup is not added.
- Public board behavior is not added.
- Notification and reply workflows are deferred to Commit 119.
- Worker-first intake migration is deferred to Commit 120.

## Admin API

- `GET /api/inquiries`
- `GET /api/inquiries/:id`
- `PATCH /api/inquiries/:id/status`
- `PATCH /api/inquiries/:id/priority`
- `POST /api/inquiries/:id/events`

The Admin API reads from `INQUIRY_DB` when present and can fall back to `ADMIN_DB` for local compatibility.

## UI

The admin app adds `/inquiries` with:

- status, priority, category, and search filters
- inquiry queue table
- detail panel
- event timeline
- admin status update action
- admin priority update action
- admin note event action

## Status transition guard

Allowed status transitions live in `workers/admin-api/src/inquiryStatusTransition.ts`.

Reopening `closed -> in-progress` and `spam -> triaged` requires an admin note. `closed -> new` and `spam -> new` are blocked to avoid rewriting operational history.

## Privacy notes

- The message body is shown only in the detail panel.
- Email is minimized in the list view.
- Debug payload, user agent, and client fingerprint are hidden behind a disclosure.
- Delete actions are intentionally not part of Commit 118.
