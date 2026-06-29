type IdleDeadlineLike = {
  didTimeout: boolean
  timeRemaining: () => number
}

type RequestIdleCallbackLike = (
  callback: (deadline: IdleDeadlineLike) => void,
  options?: { timeout?: number },
) => number

type CancelIdleCallbackLike = (handle: number) => void

type WindowWithIdleCallback = Window & {
  requestIdleCallback?: RequestIdleCallbackLike
  cancelIdleCallback?: CancelIdleCallbackLike
}

export function afterFirstPaint(task: () => void, timeout = 700): () => void {
  if (typeof window === 'undefined') {
    task()
    return () => {}
  }

  const win = window as WindowWithIdleCallback
  let cancelled = false
  let cleanup = () => {}

  const run = () => {
    if (cancelled) return
    task()
  }

  if (typeof win.requestIdleCallback === 'function') {
    const handle = win.requestIdleCallback(() => run(), { timeout })
    cleanup = () => {
      win.cancelIdleCallback?.(handle)
    }
  } else {
    let firstFrame = 0
    let secondFrame = 0
    let timer = 0

    firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        timer = window.setTimeout(run, 0)
      })
    })

    cleanup = () => {
      window.cancelAnimationFrame(firstFrame)
      window.cancelAnimationFrame(secondFrame)
      window.clearTimeout(timer)
    }
  }

  return () => {
    cancelled = true
    cleanup()
  }
}

export function afterFirstPaintAsync(task: () => Promise<void> | void, timeout = 700): () => void {
  return afterFirstPaint(() => {
    void task()
  }, timeout)
}
