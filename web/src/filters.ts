/** Which New and Full Moons the table and the ← / → steps show ("Show ▾"). */
import type { Eclipse, Phase } from './data/catalog'
import type { DistanceKind, MoonEvent } from './events'

export type MoonKind = `${Phase}-${DistanceKind}`
export const MOON_KINDS: MoonKind[] = [
  'new-super',
  'full-super',
  'new-micro',
  'full-micro',
  'new-ordinary',
  'full-ordinary',
]

/** the kinds that occur: annular only for the Sun, penumbral only for the Moon */
export type EclipseKey =
  | 'solar-total'
  | 'solar-annular'
  | 'solar-partial'
  | 'lunar-total'
  | 'lunar-partial'
  | 'lunar-penumbral'
export const ECLIPSE_KEYS: EclipseKey[] = [
  'solar-total',
  'solar-annular',
  'solar-partial',
  'lunar-total',
  'lunar-partial',
  'lunar-penumbral',
]

export interface Filter {
  moons: ReadonlySet<MoonKind>
  /** only New and Full Moons with an eclipse of the chosen kinds */
  onlyEclipses: boolean
  eclipses: ReadonlySet<EclipseKey>
}

export const ALL: Filter = { moons: new Set(MOON_KINDS), onlyEclipses: false, eclipses: new Set(ECLIPSE_KEYS) }

export function moonKind(e: MoonEvent): MoonKind {
  return `${e.syzygy.phase}-${e.kind}`
}

export function eclipseKey(e: Eclipse): EclipseKey {
  return `${e.body}-${e.kind}` as EclipseKey
}

export function applyFilter(events: readonly MoonEvent[], f: Filter): MoonEvent[] {
  return events.filter((e) => {
    if (!f.moons.has(moonKind(e))) return false
    if (!f.onlyEclipses) return true
    const ecl = e.syzygy.eclipse
    return ecl !== null && f.eclipses.has(eclipseKey(ecl))
  })
}

export function toggle<T>(set: ReadonlySet<T>, item: T): Set<T> {
  const s = new Set(set)
  if (s.has(item)) s.delete(item)
  else s.add(item)
  return s
}

/** Short text for the "Show" button. */
export function describeFilter(f: Filter): string {
  const moons = f.moons.size === MOON_KINDS.length ? '' : `${f.moons.size} of ${MOON_KINDS.length} kinds`
  if (!f.onlyEclipses) return moons || 'all'
  const eclipses =
    f.eclipses.size === ECLIPSE_KEYS.length ? 'eclipses' : `${f.eclipses.size} of ${ECLIPSE_KEYS.length} eclipse kinds`
  return moons ? `${eclipses}, ${moons}` : eclipses
}
