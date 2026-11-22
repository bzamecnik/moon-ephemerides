/**
 * Navigating a time-sorted list of events around a selected moment (the "anchor").
 * The event nearest to the anchor (before or after) is the "closest" one.
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

/** Index of the time nearest to t (the earlier one in a tie); -1 if there are none. */
export function closestIndex(times: readonly number[], t: number): number {
  if (times.length === 0) return -1
  const i = firstIndexAtOrAfter(times, t)
  if (i === 0) return 0
  if (i === times.length) return i - 1
  return times[i] - t < t - times[i - 1] ? i : i - 1
}

/** Range [start, end) with `before` events before `center` and `after` from it on. */
export function windowAround(count: number, center: number, before: number, after: number) {
  return { start: Math.max(0, center - before), end: Math.min(count, center + after) }
}

/** A new anchor at the event `steps` places away from the closest one (it becomes the closest). */
export function stepAnchor(times: readonly number[], anchor: number, steps: number): number {
  if (times.length === 0) return anchor
  const i = Math.min(Math.max(closestIndex(times, anchor) + steps, 0), times.length - 1)
  return times[i]
}

/** The ~412-day beat of the phases and the distance (1 / (1/anomalistic − 1/synodic)). */
export const BEAT_DAYS = 1 / (1 / 27.55455 - 1 / 29.530589)

/**
 * A new anchor at the event nearest to `delta` after the closest one, moving
 * at least one event in that direction (stepping by a beat lands on the same
 * phase 14 months later).
 */
export function stepByTime(times: readonly number[], anchor: number, delta: number): number {
  if (times.length === 0) return anchor
  const from = closestIndex(times, anchor)
  let to = closestIndex(times, times[from] + delta)
  if (to === from) to = Math.min(Math.max(from + Math.sign(delta), 0), times.length - 1)
  return times[to]
}
