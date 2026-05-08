import type { ParsedDirective } from '../directiveTypes'
import { attrsToHtml, renderInvalidDirective } from '../directiveHtml'

function normalizeInitial(value: unknown): number {
  const fallback = 50
  if (value === undefined || value === null || value === '') return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(100, Math.max(0, parsed))
}

export function renderBeforeAfterDirective(directive: ParsedDirective): string {
  const { attrs } = directive

  if (!attrs.before || typeof attrs.before !== 'string') {
    return renderInvalidDirective('before-after', 'missing_before')
  }

  if (!attrs.after || typeof attrs.after !== 'string') {
    return renderInvalidDirective('before-after', 'missing_after')
  }

  return `<before-after-wiper ${attrsToHtml({
    ...attrs,
    initial: normalizeInitial(attrs.initial),
  })}></before-after-wiper>`
}
