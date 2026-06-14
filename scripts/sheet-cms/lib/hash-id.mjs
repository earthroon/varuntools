import crypto from 'node:crypto'

export function hashId(value) {
  return `sha256:${crypto.createHash('sha256').update(String(value ?? '')).digest('hex')}`
}
