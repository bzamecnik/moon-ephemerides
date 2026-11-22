/**
 * One event per half beat (~206 days), for looking at decades and centuries:
 * the New or Full Moon best lined up with an apsis, and the closest supermoon
 * and farthest micromoon. See docs/astronomy.md ("The long view").
 */
import type { ApsisKind, Syzygy } from './data/catalog'
import type { MoonEvent } from './events'

export interface Aligned {
  event: MoonEvent
  apsis: ApsisKind
  /** apsis time − syzygy time, days */
  delta: number
}

/** The perigee or apogee nearer in time to the New/Full Moon. */
export function nearestApsis(s: Syzygy): { apsis: ApsisKind; delta: number } {
  return Math.abs(s.perigeeDeltaDays) <= Math.abs(s.apogeeDeltaDays)
    ? { apsis: 'perigee', delta: s.perigeeDeltaDays }
    : { apsis: 'apogee', delta: s.apogeeDeltaDays }
}

/**
 * Indices whose value is strictly better than all others within `radius`
 * places on both sides (events near the ends, without full neighbourhoods, are left out).
 */
function localBest(values: readonly number[], radius: number, better: (a: number, b: number) => boolean): number[] {
  const out: number[] = []
  for (let i = radius; i < values.length - radius; i++) {
    let best = true
    for (let j = i - radius; j <= i + radius && best; j++) if (j !== i && !better(values[i], values[j])) best = false
    if (best) out.push(i)
  }
  return out
}

/**
 * The New or Full Moon nearest in time to a perigee or apogee among its
 * neighbours (all New and Full Moons, sorted). |Δ| to the nearer apsis falls
 * by about a day per New/Full Moon towards an alignment and rises after it,
 * once every half beat; ±3 neighbours (about 1.5 months) separate the dips.
 */
export function bestAligned(events: readonly MoonEvent[], radius = 3): Aligned[] {
  const near = events.map((e) => nearestApsis(e.syzygy))
  return localBest(
    near.map((n) => Math.abs(n.delta)),
    radius,
    (a, b) => a < b,
  ).map((i) => ({ event: events[i], ...near[i] }))
}

/**
 * Supermoons closer (micromoons farther) than the New or Full Moons of the
 * same phase a month before and after: the deepest point of each run.
 */
export function extremes(events: readonly MoonEvent[], which: 'closest' | 'farthest'): MoonEvent[] {
  const kind = which === 'closest' ? 'super' : 'micro'
  const better = which === 'closest' ? (a: number, b: number) => a < b : (a: number, b: number) => a > b
  const out: MoonEvent[] = []
  for (const phase of ['new', 'full'] as const) {
    const same = events.filter((e) => e.syzygy.phase === phase)
    const picked = localBest(
      same.map((e) => e.syzygy.distanceKm),
      1,
      better,
    ).map((i) => same[i])
    out.push(...picked.filter((e) => e.kind === kind))
  }
  return out.sort((a, b) => a.syzygy.time - b.syzygy.time)
}

/**
 * Consecutive items of the same key (e.g. New Supermoons) at most `maxGapDays`
 * apart, broken where the value jumps by more than `maxJump`: for drawing
 * light lines through the long-term series. Runs of a single item are kept.
 */
export function runs<T extends { time: number; value: number }>(
  items: readonly T[],
  key: (item: T) => string,
  { maxGapDays, maxJump = Infinity }: { maxGapDays: number; maxJump?: number },
): T[][] {
  const out: T[][] = []
  const open = new Map<string, T[]>()
  for (const item of items) {
    const k = key(item)
    const run = open.get(k)
    const last = run?.at(-1)
    if (run && last && item.time - last.time <= maxGapDays * 86_400_000 && Math.abs(item.value - last.value) <= maxJump) {
      run.push(item)
    } else {
      const fresh = [item]
      out.push(fresh)
      open.set(k, fresh)
    }
  }
  return out
}
