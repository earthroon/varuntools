import { getInquiryNotificationConfig } from './notificationConfig'
import type { CreateInquiryEventInput, StoredInquiryResult, InquiryStorage } from './storage'
import type { InquiryApiRequestV1 } from './types'
import type { Env } from './worker-runtime'
import type {
  InquiryApiNotificationSummary,
  InquiryNotificationAdapter,
  InquiryNotificationChannel,
  InquiryNotificationConfig,
  InquiryNotificationPayloadV1,
  InquiryNotificationResult,
} from './notificationTypes'

function optionalText(value: string | undefined): string | undefined {
  const trimmed = value?.trim() || ''
  return trimmed || undefined
}

function buildAdminUrl(adminBaseUrl: string | undefined, inquiryId: string): string | undefined {
  const base = optionalText(adminBaseUrl)
  if (!base) return undefined
  return `${base.replace(/\/+$/, '')}/admin/inquiries?inquiry=${encodeURIComponent(inquiryId)}`
}

export function createInquiryNotificationPayload(
  request: InquiryApiRequestV1,
  stored: StoredInquiryResult,
  config: InquiryNotificationConfig,
): InquiryNotificationPayloadV1 {
  const draft = request.draft
  return {
    version: 1,
    eventType: 'new-inquiry-received',
    inquiryId: stored.inquiryId,
    createdAt: stored.createdAt,
    status: stored.status,
    priority: stored.priority,
    category: String(draft.category),
    title: draft.title,
    nickname: optionalText(draft.nickname),
    hasEmail: Boolean(optionalText(draft.email)),
    relatedProductSlug: optionalText(draft.relatedProductSlug),
    sourcePath: optionalText(request.sourcePath),
    adminUrl: buildAdminUrl(config.adminBaseUrl, stored.inquiryId),
  }
}

function disabledResult(channel: InquiryNotificationChannel): InquiryNotificationResult {
  return {
    ok: false,
    channel,
    errorCode: 'NOTIFICATION_DISABLED',
    message: 'Notification channel is disabled.',
  }
}

function missingWebhookResult(channel: InquiryNotificationChannel): InquiryNotificationResult {
  return {
    ok: false,
    channel,
    errorCode: 'MISSING_WEBHOOK_URL',
    message: 'Notification channel is enabled but no delivery endpoint is configured.',
  }
}

function createMockAdapter(enabled: boolean): InquiryNotificationAdapter {
  return {
    channel: 'mock',
    enabled,
    async notify() {
      if (!enabled) return disabledResult('mock')
      return {
        ok: true,
        channel: 'mock',
        delivered: false,
        message: 'Mock notification recorded. No external delivery was attempted.',
      }
    },
  }
}

function createEmailAdapter(enabled: boolean, recipient: string | undefined): InquiryNotificationAdapter {
  return {
    channel: 'email',
    enabled,
    async notify() {
      if (!enabled) return disabledResult('email')
      if (!optionalText(recipient)) {
        return {
          ok: false,
          channel: 'email',
          errorCode: 'MISSING_WEBHOOK_URL',
          message: 'Email notification is enabled but no recipient is configured.',
        }
      }
      return {
        ok: false,
        channel: 'email',
        errorCode: 'DELIVERY_FAILED',
        message: 'Email adapter is a placeholder. Automatic email delivery is intentionally not implemented in Commit 119.',
      }
    },
  }
}

function createSlackAdapter(enabled: boolean, webhookUrl: string | undefined): InquiryNotificationAdapter {
  return {
    channel: 'slack',
    enabled,
    async notify() {
      if (!enabled) return disabledResult('slack')
      if (!optionalText(webhookUrl)) return missingWebhookResult('slack')
      return {
        ok: false,
        channel: 'slack',
        errorCode: 'DELIVERY_FAILED',
        message: 'Slack adapter is a placeholder. External webhook delivery is not enabled by default in Commit 119.',
      }
    },
  }
}

function createDiscordAdapter(enabled: boolean, webhookUrl: string | undefined): InquiryNotificationAdapter {
  return {
    channel: 'discord',
    enabled,
    async notify() {
      if (!enabled) return disabledResult('discord')
      if (!optionalText(webhookUrl)) return missingWebhookResult('discord')
      return {
        ok: false,
        channel: 'discord',
        errorCode: 'DELIVERY_FAILED',
        message: 'Discord adapter is a placeholder. External webhook delivery is not enabled by default in Commit 119.',
      }
    },
  }
}

export function createInquiryNotificationAdapters(config: InquiryNotificationConfig): InquiryNotificationAdapter[] {
  return [
    createMockAdapter(config.enabled && config.channels.mock.enabled),
    createEmailAdapter(config.enabled && config.channels.email.enabled, config.channels.email.recipient),
    createSlackAdapter(config.enabled && config.channels.slack.enabled, config.channels.slack.webhookUrl),
    createDiscordAdapter(config.enabled && config.channels.discord.enabled, config.channels.discord.webhookUrl),
  ]
}

async function recordNotificationEvent(
  storage: InquiryStorage,
  inquiryId: string,
  result: InquiryNotificationResult,
  createdAt: string,
): Promise<void> {
  const event: CreateInquiryEventInput = {
    inquiryId,
    createdAt,
    eventType: result.ok ? 'notification-dispatched' : 'notification-failed',
    actor: 'system',
    note: result.message,
    metadata: {
      channel: result.channel,
      ok: result.ok,
      delivered: result.ok ? result.delivered : false,
      errorCode: result.ok ? undefined : result.errorCode,
    },
  }
  await storage.createInquiryEvent(event)
}

export async function dispatchInquiryNotification(input: {
  env: Env
  storage: InquiryStorage
  request: InquiryApiRequestV1
  stored: StoredInquiryResult
}): Promise<InquiryApiNotificationSummary> {
  const config = getInquiryNotificationConfig(input.env)
  const payload = createInquiryNotificationPayload(input.request, input.stored, config)
  const adapters = createInquiryNotificationAdapters(config).filter((adapter) => adapter.enabled)

  if (!config.enabled || adapters.length === 0) {
    return {
      attempted: false,
      ok: true,
      channels: [],
    }
  }

  const results = await Promise.all(adapters.map((adapter) => adapter.notify(payload)))
  await Promise.all(results.map((result) => recordNotificationEvent(input.storage, input.stored.inquiryId, result, new Date().toISOString())))

  return {
    attempted: true,
    ok: results.every((result) => result.ok),
    channels: results.map((result) => result.channel),
  }
}
