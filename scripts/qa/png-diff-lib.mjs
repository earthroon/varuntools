import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const CRC_TABLE = new Uint32Array(256)
for (let n = 0; n < 256; n += 1) {
  let c = n
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  CRC_TABLE[n] = c >>> 0
}
export function ensureDir(dirPath) { fs.mkdirSync(dirPath, { recursive: true }) }
export function sha256File(filePath) { return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex') }
function channelCount(colorType) {
  if (colorType === 0) return 1
  if (colorType === 2) return 3
  if (colorType === 4) return 2
  if (colorType === 6) return 4
  throw new Error(`Unsupported PNG color type: ${colorType}`)
}
function paeth(a, b, c) {
  const p = a + b - c
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c
}
function unfilter(data, width, height, channels) {
  const stride = width * channels
  const out = Buffer.alloc(stride * height)
  let input = 0
  for (let y = 0; y < height; y += 1) {
    const filter = data[input++], row = y * stride, prev = row - stride
    for (let x = 0; x < stride; x += 1) {
      const raw = data[input + x]
      const left = x >= channels ? out[row + x - channels] : 0
      const up = y > 0 ? out[prev + x] : 0
      const upLeft = y > 0 && x >= channels ? out[prev + x - channels] : 0
      let v = raw
      if (filter === 1) v = raw + left
      else if (filter === 2) v = raw + up
      else if (filter === 3) v = raw + Math.floor((left + up) / 2)
      else if (filter === 4) v = raw + paeth(left, up, upLeft)
      else if (filter !== 0) throw new Error(`Unsupported PNG filter type: ${filter}`)
      out[row + x] = v & 255
    }
    input += stride
  }
  return out
}
function rgbaFrom(raw, colorType, width, height) {
  const rgba = Buffer.alloc(width * height * 4)
  let s = 0
  for (let i = 0; i < width * height; i += 1) {
    const t = i * 4
    if (colorType === 0) { const g = raw[s++]; rgba[t] = g; rgba[t+1] = g; rgba[t+2] = g; rgba[t+3] = 255 }
    else if (colorType === 2) { rgba[t] = raw[s++]; rgba[t+1] = raw[s++]; rgba[t+2] = raw[s++]; rgba[t+3] = 255 }
    else if (colorType === 4) { const g = raw[s++]; rgba[t] = g; rgba[t+1] = g; rgba[t+2] = g; rgba[t+3] = raw[s++] }
    else if (colorType === 6) { rgba[t] = raw[s++]; rgba[t+1] = raw[s++]; rgba[t+2] = raw[s++]; rgba[t+3] = raw[s++] }
  }
  return rgba
}
export function readPng(filePath) {
  const buf = fs.readFileSync(filePath)
  if (!buf.subarray(0, 8).equals(PNG_SIGNATURE)) throw new Error(`Not a PNG file: ${filePath}`)
  let off = 8, width = 0, height = 0, bitDepth = 0, colorType = 0
  const idat = []
  while (off < buf.length) {
    const len = buf.readUInt32BE(off)
    const type = buf.subarray(off + 4, off + 8).toString('ascii')
    const data = buf.subarray(off + 8, off + 8 + len)
    off += 12 + len
    if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); bitDepth = data[8]; colorType = data[9]; if (data[10] || data[11] || data[12]) throw new Error(`Unsupported PNG mode: ${filePath}`) }
    else if (type === 'IDAT') idat.push(data)
    else if (type === 'IEND') break
  }
  if (bitDepth !== 8) throw new Error(`Unsupported PNG bit depth ${bitDepth}: ${filePath}`)
  const channels = channelCount(colorType)
  return { width, height, rgba: rgbaFrom(unfilter(zlib.inflateSync(Buffer.concat(idat)), width, height, channels), colorType, width, height) }
}
function crc32(type, data) {
  let crc = 0xffffffff
  for (const b of Buffer.concat([Buffer.from(type, 'ascii'), data])) crc = CRC_TABLE[(crc ^ b) & 255] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length)
  out.writeUInt32BE(data.length, 0); out.write(type, 4, 4, 'ascii'); data.copy(out, 8); out.writeUInt32BE(crc32(type, data), 8 + data.length)
  return out
}
export function writeRgbaPng(filePath, width, height, rgba) {
  const stride = width * 4
  const scan = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y += 1) { scan[y * (stride + 1)] = 0; rgba.copy(scan, y * (stride + 1) + 1, y * stride, y * stride + stride) }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 6
  ensureDir(path.dirname(filePath))
  fs.writeFileSync(filePath, Buffer.concat([PNG_SIGNATURE, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(scan)), chunk('IEND', Buffer.alloc(0))]))
}
export function comparePngFiles(baselinePath, currentPath, diffPath, options = {}) {
  const threshold = options.channelThreshold ?? 12
  const a = readPng(baselinePath), b = readPng(currentPath)
  if (a.width !== b.width || a.height !== b.height) return { reason: 'dimension-mismatch', status: 'error', width: b.width, height: b.height, baselineWidth: a.width, baselineHeight: a.height, mismatchPixels: null, mismatchRatio: null }
  const pixels = a.width * a.height
  const diff = Buffer.alloc(pixels * 4)
  let mismatchPixels = 0
  for (let i = 0; i < pixels; i += 1) {
    const o = i * 4
    const changed = Math.abs(a.rgba[o]-b.rgba[o]) > threshold || Math.abs(a.rgba[o+1]-b.rgba[o+1]) > threshold || Math.abs(a.rgba[o+2]-b.rgba[o+2]) > threshold || Math.abs(a.rgba[o+3]-b.rgba[o+3]) > threshold
    if (changed) { mismatchPixels++; diff[o]=255; diff[o+1]=0; diff[o+2]=80; diff[o+3]=255 }
    else { const g = Math.floor((b.rgba[o]+b.rgba[o+1]+b.rgba[o+2])/3*0.55); diff[o]=g; diff[o+1]=g; diff[o+2]=g; diff[o+3]=255 }
  }
  if (mismatchPixels) writeRgbaPng(diffPath, a.width, a.height, diff)
  return { reason: mismatchPixels ? 'pixel-mismatch' : 'match', status: 'ok', width: b.width, height: b.height, baselineWidth: a.width, baselineHeight: a.height, mismatchPixels, mismatchRatio: pixels ? mismatchPixels / pixels : 0, diffPath: mismatchPixels ? diffPath : null }
}
