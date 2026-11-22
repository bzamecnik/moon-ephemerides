/**
 * The lunar event catalog exported by `compute/` (`moon-ephemerides export`),
 * decoded from its columnar JSON into plain objects.
 */

/** Columnar JSON as written by compute/src/moon_ephemerides/export.py (format 1). */
export interface RawCatalog {
  meta: {
    format: number
    generator: string
    generated: string
    ephemeris: string
  }
  apsides: { t: number[]; kind: number[]; distance_km: number[] }
  syzygies: {
    t: number[]
    kind: number[]
    distance_km: number[]
    perigee_delta: number[]
    apogee_delta: number[]
    relative_distance: number[]
    lunar_eclipse: number[]
    solar_eclipse: number[]
  }
}

export type Phase = 'new' | 'full'
export type ApsisKind = 'perigee' | 'apogee'

export type EclipseKind = 'penumbral' | 'partial' | 'annular' | 'total'
export interface Eclipse {
  /** solar at New Moon (the Moon covers the Sun), lunar at Full Moon (the Earth's shadow covers the Moon) */
  body: 'solar' | 'lunar'
  kind: EclipseKind
}
const LUNAR_KINDS: EclipseKind[] = ['penumbral', 'partial', 'total']
const SOLAR_KINDS: EclipseKind[] = ['partial', 'annular', 'total']

export interface Syzygy {
  /** milliseconds since the Unix epoch (UTC), as for `Date` */
  time: number
  phase: Phase
  /** geocentric distance, km */
  distanceKm: number
  /** time of the nearest perigee minus time of the syzygy, days */
  perigeeDeltaDays: number
  /** time of the nearest apogee minus time of the syzygy, days */
  apogeeDeltaDays: number
  /** (D − D_perigee) / (D_apogee − D_perigee) of the nearest perigee and apogee: 0 at perigee, 1 at apogee */
  relativeDistance: number
  eclipse: Eclipse | null
}

export interface Apsis {
  time: number
  kind: ApsisKind
  distanceKm: number
}

export interface Catalog {
  generated: string
  ephemeris: string
  syzygies: Syzygy[]
  apsides: Apsis[]
}

export const SUPPORTED_FORMAT = 1

export function decodeCatalog(raw: RawCatalog): Catalog {
  if (raw.meta.format !== SUPPORTED_FORMAT) {
    throw new Error(`Unsupported data format ${raw.meta.format}, expected ${SUPPORTED_FORMAT}`)
  }
  const s = raw.syzygies
  const syzygies: Syzygy[] = s.t.map((t, i) => ({
    time: t * 1000,
    phase: s.kind[i] === 0 ? 'new' : 'full',
    distanceKm: s.distance_km[i],
    perigeeDeltaDays: s.perigee_delta[i],
    apogeeDeltaDays: s.apogee_delta[i],
    relativeDistance: s.relative_distance[i],
    eclipse:
      s.lunar_eclipse[i] >= 0
        ? { body: 'lunar', kind: LUNAR_KINDS[s.lunar_eclipse[i]] }
        : s.solar_eclipse[i] >= 0
          ? { body: 'solar', kind: SOLAR_KINDS[s.solar_eclipse[i]] }
          : null,
  }))
  const a = raw.apsides
  const apsides: Apsis[] = a.t.map((t, i) => ({
    time: t * 1000,
    kind: a.kind[i] === 0 ? 'perigee' : 'apogee',
    distanceKm: a.distance_km[i],
  }))
  return { generated: raw.meta.generated, ephemeris: raw.meta.ephemeris, syzygies, apsides }
}

export async function loadCatalog(url: string): Promise<Catalog> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Could not load ${url}: ${response.status}`)
  return decodeCatalog((await response.json()) as RawCatalog)
}
