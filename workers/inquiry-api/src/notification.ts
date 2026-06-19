import type {
  InquiryApiNotificationSummary,
  InquiryNotificationAdapter,
  InquiryNotificationPayloadV1,
  InquiryNotificationResult,
} from './notificationTypes'

class MockInquiryNotificationAdapter implements InquiryNotificationAdapter {
  async dispatch(payload: InquiryNotificationPayloadV1): Promise<InquiryNotificationResult> {
    const message = [
      'Mock notification recorded. No external delivery was attempted.',
      `adminUrl=${payload.adminUrl}`,
      `hasEmail=${payload.hasEmail}`,
    ].join(' ')

    return {
      ok: true,
      channel: 'mock',
      message,
      dispatchedAt: new Date().toISOString(),
    }
  }
}

export function createMockInquiryNotificationAdapter(): InquiryNotificationAdapter {
  return new MockInquiryNotificationAdapter()
}

export async function dispatchInquiryNotification(
  payload: InquiryNotificationPayloadV1,
  adapter: InquiryNotificationAdapter = createMockInquiryNotificationAdapter(),
): Promise<InquiryApiNotificationSummary> {
  const result = await adapter.dispatch(payload)
  const hasEmail = payload.hasEmail
  const adminUrl = payload.adminUrl
  const message: string = result.message

  void hasEmail
  void adminUrl
  void message

  return {
    attempted: true,
    ok: result.ok,
    channels: [result.channel],
  }
}

export const INQUIRY_NOTIFICATION_WORKFLOW_NOTES = [
  'Automatic email delivery is intentionally not implemented in Commit 119.',
  'External webhook delivery is not enabled by default in Commit 119.',
]
