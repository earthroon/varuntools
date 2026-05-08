import type MarkdownIt from 'markdown-it'
import { attrsToHtml } from './directiveHtml'
import { parseCaptionTag } from './captionTag'

type MarkdownEnv = {
  contentDir?: string
}

export function applyImageRenderRule(md: MarkdownIt): void {
  const defaultImageRenderer =
    md.renderer.rules.image ||
    ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))

  md.renderer.rules.image = (tokens, idx, options, env: MarkdownEnv, self) => {
    const token = tokens[idx]
    const src = token.attrGet('src') || ''
    const alt = token.content || token.attrGet('alt') || ''
    const title = token.attrGet('title') || ''

    if (!src) {
      return defaultImageRenderer(tokens, idx, options, env, self)
    }

    const parsedCaption = title ? parseCaptionTag(title) : { tag: '', caption: '' }

    return `<captioned-image ${attrsToHtml({
      src,
      alt,
      caption: parsedCaption.caption,
      tag: parsedCaption.tag,
      lightbox: true,
    })}></captioned-image>`
  }
}
