import type { ParsedDirective } from '../directiveTypes'
import { renderVideoPlayerDirective } from './videoPlayerDirective'

export function renderVideoDirective(directive: ParsedDirective): string {
  return renderVideoPlayerDirective(directive)
}
