/**
 * Navigating a time-sorted list of events around a selected moment (the "anchor").
 * The event at index `firstIndexAtOrAfter(times, anchor)` is the "next" one.
 */

/** Index of the first time ≥ t (binary search); `times.length` if there is none. */
export function firstIndexAtOrAfter(times: readonly number[], t: number): number {
  let lo = 0
  let hi = times.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (times[mid] < t) lo = mid + 1
    else hi = mid
  }
  return lo
}

/** Range [start, end) with `before` events before the next one and `after` from it on. */
export function windowAround(count: number, nextIndex: number, before: number, after: number) {
  return { start: Math.max(0, nextIndex - before), end: Math.min(count, nextIndex + after) }
}

/** A new anchor moved by `steps` events: the event `steps` places away becomes the next one. */
export function stepAnchor(times: readonly number[], anchor: number, steps: number): number {
  if (times.length === 0) return anchor
  const i = Math.min(Math.max(firstIndexAtOrAfter(times, anchor) + steps, 0), times.length)
  return i < times.length ? times[i] : times[times.length - 1] + 1
}
