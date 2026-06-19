export type InquiryNotificationConfig = {
  enabled: boolean
  adminBaseUrl: string
}

export function createInquiryNotificationConfig(env: { ADMIN_BASE_URL?: string } = {}): InquiryNotificationConfig {
  return {
    enabled: true,
    adminBaseUrl: env.ADMIN_BASE_URL || 'https://varun.tools/admin',
  }
}
