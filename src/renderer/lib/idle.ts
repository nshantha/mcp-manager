export function runWhenIdle(task: () => void, timeout = 300) {
  const ric = (window as any).requestIdleCallback as
    | ((cb: (deadline: { timeRemaining: () => number }) => void, opts?: { timeout: number }) => number)
    | undefined

  if (ric) {
    ric(() => task(), { timeout })
  } else {
    // Fallback for browsers/environments without requestIdleCallback
    setTimeout(task, Math.min(timeout, 300))
  }
}


