import type { Env } from './worker-runtime'
import type { InquiryNotificationConfig } from './notificationTypes'

function isEnabled(value: string | undefined): boolean {
  return value === 'true' || value === '1'
}

export function getInquiryNotificationConfig(env: Env): InquiryNotificationConfig {
  return {
    enabled: isEnabled(env.INQUIRY_NOTIFICATION_ENABLED),
    adminBaseUrl: env.INQUIRY_ADMIN_BASE_URL,
    channels: {
      mock: {
        enabled: true,
      },
      email: {
        enabled: isEnabled(env.INQUIRY_NOTIFICATION_EMAIL_ENABLED),
        recipient: env.INQUIRY_NOTIFICATION_EMAIL_RECIPIENT,
      },
      slack: {
        enabled: isEnabled(env.INQUIRY_NOTIFICATION_SLACK_ENABLED),
        webhookUrl: env.INQUIRY_NOTIFICATION_SLACK_WEBHOOK_URL,
      },
      discord: {
        enabled: isEnabled(env.INQUIRY_NOTIFICATION_DISCORD_ENABLED),
        webhookUrl: env.INQUIRY_NOTIFICATION_DISCORD_WEBHOOK_URL,
      },
    },
  }
}
