/**
 * ▶ Play: the selected moment moves forward step by step. Fixed steps show the
 * Moon moving; a mean synodic month keeps the phase (a stroboscope: the lines
 * of the orbit turn); a beat keeps the phase and the distance; live follows the clock.
 */
import { BEAT_DAYS, closestIndex, stepByTime } from './timeline'

const HOUR = 3_600_000
const DAY = 24 * HOUR
const SYNODIC_MONTH_DAYS = 29.530589

export type PlayStep = 'hours' | 'day' | 'week' | 'month' | 'beat' | 'live'

export const PLAY_STEPS: { id: PlayStep; label: string; title: string }[] = [
  { id: 'hours', label: '6 hours', title: 'A month in about 12 seconds' },
  { id: 'day', label: '1 day', title: 'A month in 3 seconds' },
  { id: 'week', label: '1 week', title: 'From one quarter of the Moon to the next' },
  { id: 'month', label: '1 month', title: 'The same phase each time (29.53 days): watch the orbit turn' },
  { id: 'beat', label: '1 beat', title: 'The same phase and distance each time (about 14 months)' },
  { id: 'live', label: 'live', title: 'Follow the clock, updated every minute' },
]

const FIXED: Partial<Record<PlayStep, number>> = {
  hours: 6 * HOUR,
  day: DAY,
  week: 7 * DAY,
  month: SYNODIC_MONTH_DAYS * DAY,
}

/** The next moment, or null at the end of the data. `times`: all New and Full Moons, sorted. */
export function nextPlayAnchor(step: PlayStep, anchor: number, times: readonly number[], now: number): number | null {
  if (step === 'live') return now
  const fixed = FIXED[step]
  if (fixed !== undefined) {
    const next = anchor + fixed
    return next > times.at(-1)! ? null : next
  }
  const next = stepByTime(times, anchor, BEAT_DAYS * DAY)
  return next === times[closestIndex(times, anchor)] ? null : next
}

export function playInterval(step: PlayStep): number {
  return step === 'live' ? 60_000 : 100
}

/** The next smaller or larger step ([ and ] keys), not going round and leaving out live. */
export function cycleStep(step: PlayStep, dir: 1 | -1): PlayStep {
  const steps = PLAY_STEPS.map((s) => s.id).filter((s) => s !== 'live')
  const i = step === 'live' ? steps.length : steps.indexOf(step)
  return steps[Math.min(steps.length - 1, Math.max(0, i + dir))]
}
