


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
