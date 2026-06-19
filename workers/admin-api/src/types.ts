export interface Env {
  INQUIRY_DB?: D1Database
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  all<T = unknown>(): Promise<{ results: T[] }>
  first<T = unknown>(): Promise<T | null>
  run(): Promise<{ success: boolean }>
}


// F6-F32 admin audit runtime summary contract.
export interface AdminActionAuditSummary {
  auditLogId: string
  auditRecordedAt: string
  requestId: string
  action?: string
  actorEmailMasked?: string
  planStatus?: string
  executionAllowed?: boolean
}

export interface AccessIdentity {
  iss: string
  sub?: string
  aud?: string | string[]
  exp?: number
  nbf?: number
  iat?: number
  type?: string
  email: string
  name?: string
}
