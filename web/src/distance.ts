/**
 * The Earth–Moon distance between events, approximated from the apsides:
 * half a cosine wave from each perigee to the next apogee and back (as in an
 * ellipse, d ≈ a(1 − e cos M)). Exact at the apsides; against the true
 * distances of New and Full Moons 1850–2149 the median error is ~400 km, the
 * worst ~4400 km (where the two halves of the orbit are lopsided).
 */
import type { Apsis } from './data/catalog'
import { firstIndexAtOrAfter } from './timeline'

export function distanceAt(apsides: readonly Apsis[], t: number): number | null {
  const times = apsides.map((a) => a.time)
  return distanceAtIndexed(apsides, times, t)
}

function distanceAtIndexed(apsides: readonly Apsis[], times: readonly number[], t: number): number | null {
  const i = firstIndexAtOrAfter(times, t)
  if (i < times.length && times[i] === t) return apsides[i].distanceKm
  if (i === 0 || i === times.length) return null
  const [a, b] = [apsides[i - 1], apsides[i]]
  const f = (t - a.time) / (b.time - a.time)
  return a.distanceKm + ((b.distanceKm - a.distanceKm) * (1 - Math.cos(Math.PI * f))) / 2
}

export interface DistancePoint {
  time: number
  km: number
}

export function sampleDistance(apsides: readonly Apsis[], t0: number, t1: number, step: number): DistancePoint[] {
  const times = apsides.map((a) => a.time)
  const points: DistancePoint[] = []
  for (let t = t0; t <= t1; t += step) {
    const km = distanceAtIndexed(apsides, times, t)
    if (km !== null) points.push({ time: t, km })
  }
  return points
}
