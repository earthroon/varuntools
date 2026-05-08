export type D1Value = string | number | boolean | null | ArrayBuffer | Uint8Array

export type D1Result<T = unknown> = {
  results?: T[]
  success: boolean
  meta?: Record<string, unknown>
  error?: string
}

export type D1PreparedStatement = {
  bind(...values: D1Value[]): D1PreparedStatement
  run<T = unknown>(): Promise<D1Result<T>>
  first<T = unknown>(): Promise<T | null>
  all<T = unknown>(): Promise<D1Result<T>>
}

export type D1Database = {
  prepare(query: string): D1PreparedStatement
}

export type Env = {
  INQUIRY_ALLOWED_ORIGINS?: string
  INQUIRY_STORAGE_MODE?: 'd1' | 'mock'
  INQUIRY_DB?: D1Database
  INQUIRY_NOTIFICATION_ENABLED?: string
  INQUIRY_ADMIN_BASE_URL?: string
  INQUIRY_NOTIFICATION_EMAIL_ENABLED?: string
  INQUIRY_NOTIFICATION_EMAIL_RECIPIENT?: string
  INQUIRY_NOTIFICATION_SLACK_ENABLED?: string
  INQUIRY_NOTIFICATION_SLACK_WEBHOOK_URL?: string
  INQUIRY_NOTIFICATION_DISCORD_ENABLED?: string
  INQUIRY_NOTIFICATION_DISCORD_WEBHOOK_URL?: string
}
