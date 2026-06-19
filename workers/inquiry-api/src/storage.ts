import { createInquiryEventId, createInquiryId } from './id'
import type { Env } from './worker-runtime'
import type { InquiryApiRequestV1, InquiryStorageMode } from './types'
import type { InquiryEventType, InquiryPriority, InquiryStatus } from './status'

export type InsertInquiryInput = {
  request: InquiryApiRequestV1
  receivedAt: string
  requestIpHash?: string
  payloadJson: string
}

export type StoredInquiryResult = {
  inquiryId: string
  persisted: boolean
  storageMode: InquiryStorageMode
  status: InquiryStatus
  priority: InquiryPriority
}

export type InquiryStorage = {
  insertInquiry(input: InsertInquiryInput): Promise<StoredInquiryResult>
}

type InquiryEventInput = {
  inquiryId: string
  eventType: InquiryEventType
  createdAt: string
  payloadJson: string
}

class MockInquiryStorage implements InquiryStorage {
  async insertInquiry(): Promise<StoredInquiryResult> {
    return {
      inquiryId: createInquiryId(),
      persisted: false,
      storageMode: 'mock',
      status: 'new',
      priority: 'normal',
    }
  }
}

class D1InquiryStorage implements InquiryStorage {
  constructor(private readonly db: D1Database) {}

  async insertInquiry(input: InsertInquiryInput): Promise<StoredInquiryResult> {
    const inquiryId = createInquiryId()
    const status: InquiryStatus = 'new'
    const priority: InquiryPriority = 'normal'
    const draft = input.request.draft
    const eventReceived: InquiryEventInput = {
      inquiryId,
      eventType: 'received',
      createdAt: input.receivedAt,
      payloadJson: input.payloadJson,
    }
    const eventStored: InquiryEventInput = {
      inquiryId,
      eventType: 'stored',
      createdAt: input.receivedAt,
      payloadJson: input.payloadJson,
    }

    await this.db.prepare(`INSERT INTO inquiries (
      id, status, priority, category, title, message, email, nickname, related_product_slug,
      source_path, source_url, submitted_at, created_at, updated_at, ip_hash, payload_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      inquiryId,
      status,
      priority,
      draft.category,
      draft.title,
      draft.message,
      draft.email || null,
      draft.nickname || null,
      draft.relatedProductSlug || null,
      input.request.sourcePath,
      input.request.sourceUrl || null,
      input.request.submittedAt,
      input.receivedAt,
      input.receivedAt,
      input.requestIpHash || null,
      input.payloadJson,
    ).run()

    await this.insertEvent(eventReceived)
    await this.insertEvent(eventStored)

    return {
      inquiryId,
      persisted: true,
      storageMode: 'd1',
      status,
      priority,
    }
  }

  private async insertEvent(input: InquiryEventInput): Promise<void> {
    await this.db.prepare(`INSERT INTO inquiry_events (id, inquiry_id, event_type, created_at, payload_json) VALUES (?, ?, ?, ?, ?)`).bind(
      createInquiryEventId(),
      input.inquiryId,
      input.eventType,
      input.createdAt,
      input.payloadJson,
    ).run()
  }
}

export function createInquiryStorage(env: Env): InquiryStorage {
  if (env.INQUIRY_STORAGE_MODE === 'mock' || !env.INQUIRY_DB) return new MockInquiryStorage()
  return new D1InquiryStorage(env.INQUIRY_DB)
}
