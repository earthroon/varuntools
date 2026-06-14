import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const WEBP_QUALITY = Number(process.env.SHEET_CMS_WEBP_QUALITY || 82)

function commandExists(command, args = ['-version']) {
  const result = spawnSync(command, args, { stdio: 'ignore' })
  return result.status === 0
}

function resolveConverter() {
  const configured = process.env.SHEET_CMS_IMAGE_CONVERTER
  if (configured) return configured
  if (commandExists('magick')) return 'magick'
  if (commandExists('convert')) return 'convert'
  if (commandExists('/opt/imagemagick/bin/convert')) return '/opt/imagemagick/bin/convert'
  return ''
}

function runConvert(command, inputPath, outputPath) {
  const args = command.endsWith('magick') || command === 'magick'
    ? [inputPath, '-auto-orient', '-strip', '-quality', String(WEBP_QUALITY), outputPath]
    : [inputPath, '-auto-orient', '-strip', '-quality', String(WEBP_QUALITY), outputPath]
  const result = spawnSync(command, args, { encoding: 'utf8' })
  if (result.status !== 0) {
    throw new Error(`WebP conversion failed: ${result.stderr || result.stdout || `exit ${result.status}`}`)
  }
}

export async function optimizeImageBufferToWebp({ buffer, assetId, sourceExt = 'img' }) {
  const command = resolveConverter()
  if (!command) {
    throw new Error('ImageMagick is required for WebP conversion. Install imagemagick or set SHEET_CMS_IMAGE_CONVERTER.')
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'varuntools-webp-'))
  const inputPath = path.join(tmpDir, `${assetId}.${String(sourceExt || 'img').replace(/^\./, '')}`)
  const outputPath = path.join(tmpDir, `${assetId}.webp`)

  try {
    await fs.writeFile(inputPath, buffer)
    runConvert(command, inputPath, outputPath)
    return await fs.readFile(outputPath)
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true })
  }
}
