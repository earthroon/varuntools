export type TouchPoint = {
  x: number
  y: number
}

export type PinchState = {
  active: boolean
  startDistance: number
  startZoom: number
  center: TouchPoint
}

export type SwipeState = {
  active: boolean
  startX: number
  startY: number
  lastX: number
  lastY: number
  startAt: number
}

export type DoubleTapState = {
  lastTapAt: number
  lastTapX: number
  lastTapY: number
}

export const DEFAULT_DOUBLE_TAP_MS = 220
export const DEFAULT_DOUBLE_TAP_DISTANCE_PX = 28

export function getTouchPoint(touch: Touch): TouchPoint {
  return {
    x: touch.clientX,
    y: touch.clientY,
  }
}

export function getTouchDistance(a: Touch, b: Touch): number {
  const dx = a.clientX - b.clientX
  const dy = a.clientY - b.clientY
  return Math.hypot(dx, dy)
}

export function getTouchCenter(a: Touch, b: Touch): TouchPoint {
  return {
    x: (a.clientX + b.clientX) / 2,
    y: (a.clientY + b.clientY) / 2,
  }
}

export function getPointDistance(a: TouchPoint, b: TouchPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function isStrictDoubleTap(options: {
  now: number
  x: number
  y: number
  lastTapAt: number
  lastTapX: number
  lastTapY: number
  thresholdMs?: number
  distancePx?: number
}): boolean {
  const thresholdMs = options.thresholdMs ?? DEFAULT_DOUBLE_TAP_MS
  const distancePx = options.distancePx ?? DEFAULT_DOUBLE_TAP_DISTANCE_PX

  if (options.lastTapAt <= 0) return false
  if (options.now - options.lastTapAt > thresholdMs) return false

  const distance = getPointDistance(
    { x: options.x, y: options.y },
    { x: options.lastTapX, y: options.lastTapY },
  )

  return distance <= distancePx
}
