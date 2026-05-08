import MarkdownIt from 'markdown-it'
import { directivePlugin } from './directivePlugin'
import { applyImageRenderRule } from './imageRenderRule'

export function createMarkdownRenderer() {
  const md = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
  })

  md.use(directivePlugin)
  applyImageRenderRule(md)

  return md
}
