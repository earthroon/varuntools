export const CAPTION_TAGS = ['필수', '선택', '기타'] as const

export type CaptionTag = (typeof CAPTION_TAGS)[number]

export type ParsedCaptionTag = {
  tag: CaptionTag | ''
  caption: string
}

const CAPTION_TAG_SET = new Set<string>(CAPTION_TAGS)

export function isCaptionTag(value: string | undefined): value is CaptionTag {
  return Boolean(value && CAPTION_TAG_SET.has(value))
}

export function parseCaptionTag(input: string): ParsedCaptionTag {
  const value = input.trim()
  const match = value.match(/^\[(필수|선택|기타)\]\s*(.*)$/)

  if (!match) {
    return {
      tag: '',
      caption: value,
    }
  }

  return {
    tag: match[1] as CaptionTag,
    caption: match[2]?.trim() || '',
  }
}
