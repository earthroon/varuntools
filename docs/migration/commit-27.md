# Commit 27 — Accessibility Pass

## Scope

- Keyboard focus
- ARIA labels
- Collapsible states
- Range slider states
- Escape close behavior
- Reduced motion

## Rules

- Interactive elements must be keyboard reachable.
- Collapsible UI must expose `aria-expanded` and `aria-controls`.
- Icon-only controls must expose labels.
- Decorative card thumbnails should use empty alt text or be hidden from assistive tech.
- Reduced motion must suppress non-essential motion.
- Focus outlines must not be hidden.
