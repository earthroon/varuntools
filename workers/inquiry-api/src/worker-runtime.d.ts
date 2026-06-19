export type D1Result<T = unknown> = {
  results?: T[]
  success?: boolean
  meta?: { changes?: number; last_row_id?: number }
}

export type D1PreparedStatement = {
  bind(...values: unknown[]): D1PreparedStatement
  first<T = unknown>(): Promise<T | null>
  run<T = unknown>(): Promise<D1Result<T>>
  all<T = unknown>(): Promise<D1Result<T>>
}

export type D1Database = {
  prepare(query: string): D1PreparedStatement
}

export type Env = {
  INQUIRY_ALLOWED_ORIGINS?: string
  INQUIRY_STORAGE_MODE?: 'd1' | 'mock'
  INQUIRY_DB?: D1Database
}
