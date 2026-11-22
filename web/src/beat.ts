/**
 * The beat of the two rhythms: for each New and Full Moon, the time Δ to the
 * nearest perigee. Supermoons sit near Δ = 0, micromoons near ±13.8 days
 * (half an anomalistic month, where the apogee is).
 */
import type { MoonEvent } from './events'
import { splitAtWraps } from './phase'
import { firstIndexAtOrAfter } from './timeline'

export interface BeatPoint {
  event: MoonEvent
  time: number
  /** time of the nearest perigee minus time of the syzygy, days */
  delta: number
}

/** Half an anomalistic month: where the apogee sits on the beat chart */
export const HALF_ANOMALISTIC_DAYS = 27.5546 / 2

/** Points for the events (sorted by time) in [t0, t1]. */
export function beatPoints(events: readonly MoonEvent[], t0: number, t1: number): BeatPoint[] {
  const times = events.map((e) => e.syzygy.time)
  return events
    .slice(firstIndexAtOrAfter(times, t0), firstIndexAtOrAfter(times, t1 + 1))
    .map((e) => ({ event: e, time: e.syzygy.time, delta: e.syzygy.perigeeDeltaDays }))
}

/**
 * Lines through consecutive New Moons and, separately, consecutive Full Moons.
 * A jump of more than a week means the nearest perigee switched to the next
 * one (Δ wrapped around), so the line is broken there.
 */
export function beatLines(points: readonly BeatPoint[]): BeatPoint[][] {
  const lines: BeatPoint[][] = []
  for (const phase of ['new', 'full'] as const) {
    const ofPhase = points.filter((p) => p.event.syzygy.phase === phase)
    lines.push(...splitAtWraps(ofPhase, (a, b) => Math.abs(b.delta - a.delta) > 7))
  }
  return lines
}
