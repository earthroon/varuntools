import type { D1Database, Env } from './worker-runtime'
import type { InquiryApiRequestV1 } from './types'
import { createInquiryEventId, createInquiryId } from './id'
import {
  DEFAULT_INQUIRY_PRIORITY,
  DEFAULT_INQUIRY_STATUS,
  type InquiryEventType,
  type InquiryPriority,
  type InquiryStatus,
  type InquiryStorageMode,
} from './status'


export type InsertInquiryInput = {
  request: InquiryApiRequestV1
  receivedAt: string
  userAgent?: string
  ipHash?: string
}

export type StoredInquiryResult = {
  inquiryId: string
  status: InquiryStatus
  priority: InquiryPriority
  persisted: boolean
  storageMode: InquiryStorageMode
  createdAt: string
}

export type CreateInquiryEventInput = {
  inquiryId: string
  eventType: InquiryEventType
  createdAt: string
  note?: string
  actor?: string
  metadata?: Record<string, unknown>
}

export type InquiryListQuery = {
  status?: InquiryStatus
  priority?: InquiryPriority
  category?: string
  search?: string
  limit?: number
  cursor?: string
}

export type InquiryListItem = {
  id: string
  createdAt: string
  updatedAt: string
  status: InquiryStatus
  priority: InquiryPriority
  category: string
  nickname?: string
  email?: string
  title: string
  relatedProductSlug?: string
}

export type InquiryEventRecord = {
  id: string
  inquiryId: string
  createdAt: string
  eventType: InquiryEventType
  note?: string
  actor?: string
  metadataJson?: string
}

export type InquiryDetail = InquiryListItem & {
  message: string
  sourcePath?: string
  sourceUrl?: string
  payloadJson: string
  events: InquiryEventRecord[]
}

export type InquiryStorage = {
  insertInquiry(input: InsertInquiryInput): Promise<StoredInquiryResult>
  createInquiryEvent(input: CreateInquiryEventInput): Promise<void>
}

function optionalText(value: string | undefined): string | null {
  const trimmed = value?.trim() || ''
  return trimmed || null
}

function payloadJson(request: InquiryApiRequestV1): string {
  return JSON.stringify(request)
}

export class D1InquiryStorage implements InquiryStorage {
  constructor(private readonly db: D1Database) {}

  async insertInquiry(input: InsertInquiryInput): Promise<StoredInquiryResult> {
    const inquiryId = createInquiryId()
    const createdAt = input.receivedAt
    const updatedAt = input.receivedAt
    const status = DEFAULT_INQUIRY_STATUS
    const priority = DEFAULT_INQUIRY_PRIORITY
    const draft = input.request.draft

    await this.db.prepare(`
      INSERT INTO inquiries (
        id,
        created_at,
        updated_at,
        received_at,
        status,
        priority,
        category,
        nickname,
        email,
        title,
        message,
        related_product_slug,
        source_path,
        source_url,
        client_fingerprint,
        user_agent,
        ip_hash,
        payload_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      inquiryId,
      createdAt,
      updatedAt,
      input.receivedAt,
      status,
      priority,
      draft.category,
      optionalText(draft.nickname),
      optionalText(draft.email),
      draft.title,
      draft.message,
      optionalText(draft.relatedProductSlug),
      input.request.sourcePath,
      optionalText(input.request.sourceUrl),
      optionalText(input.request.clientGuard?.fingerprint),
      optionalText(input.userAgent),
      optionalText(input.ipHash),
      payloadJson(input.request),
    ).run()

    await this.createInquiryEvent({
      inquiryId,
      createdAt,
      eventType: 'received',
      note: 'Inquiry request received by Worker API.',
      actor: 'system',
      metadata: { storageMode: 'd1' },
    })

    await this.createInquiryEvent({
      inquiryId,
      createdAt,
      eventType: 'stored',
      note: 'Inquiry request persisted to D1.',
      actor: 'system',
      metadata: { table: 'inquiries' },
    })

    return {
      inquiryId,
      status,
      priority,
      persisted: true,
      storageMode: 'd1',
      createdAt,
    }
  }

  async createInquiryEvent(input: CreateInquiryEventInput): Promise<void> {
    await this.db.prepare(`
      INSERT INTO inquiry_events (
        id,
        inquiry_id,
        created_at,
        event_type,
        note,
        actor,
        metadata_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      createInquiryEventId(),
      input.inquiryId,
      input.createdAt,
      input.eventType,
      optionalText(input.note),
      optionalText(input.actor),
      input.metadata ? JSON.stringify(input.metadata) : null,
    ).run()
  }
}

export class MockInquiryStorage implements InquiryStorage {
  async insertInquiry(input: InsertInquiryInput): Promise<StoredInquiryResult> {
    return {
      inquiryId: createInquiryId(),
      status: DEFAULT_INQUIRY_STATUS,
      priority: DEFAULT_INQUIRY_PRIORITY,
      persisted: false,
      storageMode: 'mock',
      createdAt: input.receivedAt,
    }
  }

  async createInquiryEvent(): Promise<void> {
    return undefined
  }
}

export function createInquiryStorage(env: Env): InquiryStorage {
  if (env.INQUIRY_STORAGE_MODE === 'mock') return new MockInquiryStorage()
  if (!env.INQUIRY_DB) throw new Error('INQUIRY_DB binding is not configured.')
  return new D1InquiryStorage(env.INQUIRY_DB)
}
