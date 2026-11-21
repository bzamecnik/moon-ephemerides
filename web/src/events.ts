/**
 * Classification of New and Full Moons by their distance (Espenak's definitions,
 * see docs/astronomy.md): supermoon = relative distance ≤ 0.1, micromoon ≥ 0.9.
 */
import type { ApsisKind, Phase, Syzygy } from './data/catalog'

export const SUPERMOON_LIMIT = 0.1
export const MICROMOON_LIMIT = 0.9
const DAY_MS = 86_400_000
const MOON_RADIUS_KM = 1737.4

export type DistanceKind = 'super' | 'micro' | 'ordinary'
/** The four notable combinations, e.g. 'new-super' */
export type NotableKind = `${Phase}-${'super' | 'micro'}`
export const NOTABLE_KINDS: NotableKind[] = ['new-super', 'full-super', 'new-micro', 'full-micro']

export interface MoonEvent {
  syzygy: Syzygy
  kind: DistanceKind
  /** perigee for supermoons, apogee for micromoons, the nearer one in distance otherwise */
  apsis: ApsisKind
  /** time of that apsis minus time of the syzygy, days */
  deltaDays: number
  apsisTime: number
  /** relative distance as printed by Espenak: 1 exactly at the apsis, 0 at the opposite one */
  closeness: number
}

export function classify(s: Syzygy): MoonEvent {
  const r = s.relativeDistance
  const kind: DistanceKind = r <= SUPERMOON_LIMIT ? 'super' : r >= MICROMOON_LIMIT ? 'micro' : 'ordinary'
  const apsis: ApsisKind = kind === 'super' || (kind === 'ordinary' && r < 0.5) ? 'perigee' : 'apogee'
  const deltaDays = apsis === 'perigee' ? s.perigeeDeltaDays : s.apogeeDeltaDays
  return {
    syzygy: s,
    kind,
    apsis,
    deltaDays,
    apsisTime: s.time + deltaDays * DAY_MS,
    closeness: apsis === 'perigee' ? 1 - r : r,
  }
}

export function notableKind(e: MoonEvent): NotableKind | null {
  return e.kind === 'ordinary' ? null : `${e.syzygy.phase}-${e.kind}`
}

export interface EventFilter {
  /** which of the four notable kinds to keep (default: all) */
  kinds?: ReadonlySet<NotableKind>
  /** keep also New/Full Moons that are neither super- nor micromoons */
  includeOrdinary?: boolean
}

export function moonEvents(syzygies: readonly Syzygy[], filter: EventFilter = {}): MoonEvent[] {
  const kinds = filter.kinds ?? new Set(NOTABLE_KINDS)
  return syzygies.map(classify).filter((e) => {
    const k = notableKind(e)
    return k === null ? !!filter.includeOrdinary : kinds.has(k)
  })
}

const PHASE_NAMES: Record<Phase, string> = { new: 'New', full: 'Full' }
const KIND_NAMES: Record<DistanceKind, string> = { super: 'Supermoon', micro: 'Micromoon', ordinary: 'Moon' }

export function eventLabel(e: MoonEvent): string {
  return `${PHASE_NAMES[e.syzygy.phase]} ${KIND_NAMES[e.kind]}`
}

export function apparentDiameterArcmin(distanceKm: number): number {
  return ((2 * Math.asin(MOON_RADIUS_KM / distanceKm) * 180) / Math.PI) * 60
}
