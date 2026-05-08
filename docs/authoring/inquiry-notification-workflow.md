# Inquiry notification workflow

Commit 119 adds a notification contract for newly stored inquiries. The goal is to help an operator notice new private inquiries without turning Slack, Discord, or email into the canonical inquiry store.

## Scope

- `InquiryNotificationPayloadV1`
- disabled-by-default notification config
- mock/email/slack/discord adapter placeholders
- notification summary on the Worker response
- notification event logging into `inquiry_events`

## Privacy rule

The notification payload intentionally omits the full inquiry message, raw email address, and `payload_json` by default. It only exposes summary fields such as title, category, priority, `hasEmail`, source path, and an optional `adminUrl`.

## Failure rule

D1 storage success is the inquiry receipt boundary. Notification failure must not make the inquiry POST response fail. Delivery failures are recorded as `notification-failed` events.

## Default behavior

External delivery is off by default. The mock adapter can record the workflow shape without sending anything outside the system.
