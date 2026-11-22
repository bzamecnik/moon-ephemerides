/**
 * Position within the two lunar cycles, by linear interpolation in time
 * between events (crude: the real motion is not uniform, but every event
 * lands exactly where it should).
 *
 * - synodic phase: 0 at New Moon, 0.5 at Full Moon
 * - anomalistic phase: 0 at perigee, 0.5 at apogee
 */
import type { Apsis, Syzygy } from './data/catalog'
import { firstIndexAtOrAfter } from './timeline'

export interface PhaseMarks {
  times: number[]
  /** 0 or 0.5 */
  phases: number[]
}

export function synodicMarks(syzygies: readonly Syzygy[]): PhaseMarks {
  return { times: syzygies.map((s) => s.time), phases: syzygies.map((s) => (s.phase === 'new' ? 0 : 0.5)) }
}

export function anomalisticMarks(apsides: readonly Apsis[]): PhaseMarks {
  return { times: apsides.map((a) => a.time), phases: apsides.map((a) => (a.kind === 'perigee' ? 0 : 0.5)) }
}

/** Phase in [0, 1) at time t, or null outside the marks. Marks must alternate 0, 0.5, 0, ... */
export function phaseAt(marks: PhaseMarks, t: number): number | null {
  const { times, phases } = marks
  const i = firstIndexAtOrAfter(times, t)
  if (i < times.length && times[i] === t) return phases[i]
  if (i === 0 || i === times.length) return null
  const fraction = (t - times[i - 1]) / (times[i] - times[i - 1])
  return (phases[i - 1] + fraction * 0.5) % 1
}

export interface PhasePoint {
  time: number
  synodic: number
  anomalistic: number
}

export function samplePhases(
  synodic: PhaseMarks,
  anomalistic: PhaseMarks,
  t0: number,
  t1: number,
  step: number,
): PhasePoint[] {
  const points: PhasePoint[] = []
  for (let t = t0; t <= t1; t += step) {
    const s = phaseAt(synodic, t)
    const a = phaseAt(anomalistic, t)
    if (s !== null && a !== null) points.push({ time: t, synodic: s, anomalistic: a })
  }
  return points
}

/** Splits a sequence into runs, starting a new one wherever `jumped(previous, current)`. */
export function splitAtWraps<T>(items: readonly T[], jumped: (a: T, b: T) => boolean): T[][] {
  const runs: T[][] = []
  items.forEach((item, i) => {
    if (i === 0 || jumped(items[i - 1], item)) runs.push([item])
    else runs[runs.length - 1].push(item)
  })
  return runs
}
