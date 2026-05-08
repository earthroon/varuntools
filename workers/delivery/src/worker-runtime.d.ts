type D1Result<T = unknown> = {
  results?: T[]
  success?: boolean
  meta?: { changes?: number; [key: string]: unknown }
  error?: string
}

type D1PreparedStatement = {
  bind(...values: unknown[]): D1PreparedStatement
  all<T = unknown>(): Promise<D1Result<T>>
  first<T = unknown>(): Promise<T | null>
  run(): Promise<D1Result>
}

type D1Database = {
  prepare(query: string): D1PreparedStatement
}

type R2ObjectBody = {
  body: ReadableStream
  size?: number
  etag?: string
}

type R2Bucket = {
  get(key: string): Promise<R2ObjectBody | null>
}
