/**
 * The Moon's position seen from above the ecliptic, in a frame turning with
 * the Sun: the Sun stays in one direction (angle 0), the Moon goes round once
 * per synodic month, the line of apsides once per beat (411.8 days) and the
 * line of nodes once per eclipse year (346.6 days). See docs/astronomy.md
 * ("Looking from above: the frame of the Sun").
 *
 * Positions come from astronomy-engine (Don Cross, MIT); the mean perigee and
 * node from Meeus, Astronomical Algorithms, ch. 47.
 */
import { EclipticGeoMoon, SunPosition } from 'astronomy-engine'

const AU_KM = 149_597_870.7
const DAY_MS = 86_400_000
const J2000_MS = Date.UTC(2000, 0, 1, 12)

/** Angle in degrees wrapped to [0, 360). */
export function wrap360(deg: number): number {
  return ((deg % 360) + 360) % 360
}

/** Angle in degrees wrapped to [−180, 180). */
export function wrap180(deg: number): number {
  return wrap360(deg + 180) - 180
}

/** Julian centuries since J2000 (UT; ΔT of about a minute doesn't matter here). */
function centuries(time: number): number {
  return (time - J2000_MS) / (36_525 * DAY_MS)
}

/**
 * Mean ecliptic longitudes (degrees, equinox of date) of the perigee and of the
 * ascending node. The perigee moves forward once in 8.85 years, the node back
 * once in 18.6 years. The true perigee swings up to ±25° around the mean one
 * (evection), the true node ±2°.
 */
export function meanElements(time: number): { perigee: number; node: number } {
  const T = centuries(time)
  const L = 218.3164477 + 481_267.88123421 * T - 0.0015786 * T * T // mean longitude of the Moon
  const M = 134.9633964 + 477_198.8675055 * T + 0.0087414 * T * T // mean anomaly of the Moon
  const node = 125.0445479 - 1934.1362891 * T + 0.0020754 * T * T
  return { perigee: wrap360(L - M), node: wrap360(node) }
}

export interface MoonPlace {
  time: number
  /** the Moon's ecliptic longitude minus the Sun's, degrees [0, 360): 0 New, 90 first quarter, 180 Full */
  elongation: number
  /** degrees north (+) or south (−) of the ecliptic */
  latitude: number
  /** geocentric, km */
  distanceKm: number
}

export function moonPlace(time: number): MoonPlace {
  const date = new Date(time)
  const moon = EclipticGeoMoon(date)
  const sun = SunPosition(date)
  return {
    time,
    elongation: wrap360(moon.lon - sun.elon),
    latitude: moon.lat,
    distanceKm: moon.dist * AU_KM,
  }
}

/** The Moon's places from t0 to t1 (inclusive) every `stepHours`. */
export function moonTrack(t0: number, t1: number, stepHours: number): MoonPlace[] {
  const step = stepHours * 3_600_000
  const out: MoonPlace[] = []
  for (let t = t0; t < t1; t += step) out.push(moonPlace(t))
  out.push(moonPlace(t1))
  return out
}

export interface OrbitFrame {
  /** direction of the mean perigee, degrees from the Sun direction (counter-clockwise seen from the north) */
  perigee: number
  /** direction of the mean ascending node (where the Moon crosses the ecliptic going north), likewise */
  node: number
}

/** The mean line of apsides and line of nodes in the Sun's frame. */
export function orbitFrame(time: number): OrbitFrame {
  const { perigee, node } = meanElements(time)
  const sun = SunPosition(new Date(time)).elon
  return { perigee: wrap360(perigee - sun), node: wrap360(node - sun) }
}

/**
 * How far a line through the Earth (given by the direction of one end) is from
 * pointing at the Sun: 0° when either end points at or away from it, 90° when across.
 */
export function lineToSun(direction: number): number {
  const a = Math.abs(wrap180(direction))
  return Math.min(a, 180 - a)
}

const PHASE_NAMES = [
  'New Moon',
  'waxing crescent',
  'first quarter',
  'waxing gibbous',
  'Full Moon',
  'waning gibbous',
  'last quarter',
  'waning crescent',
]

/** The usual name of the phase at a given elongation (eight 45° sectors centred on 0°, 45°, …). */
export function phaseName(elongation: number): string {
  return PHASE_NAMES[Math.round(wrap360(elongation) / 45) % 8]
}

/** days of the Moon's path drawn before and after the moment */
const TRAIL_PAST_DAYS = 14
const TRAIL_COMING_DAYS = 15

/**
 * The span of the Moon's path to draw, sliding with the moment: 29 days, just
 * under one round in the frame of the Sun (a synodic month, 29.53 days), so
 * that the path doesn't overlap itself, and over half of it ahead, so that the
 * next New or Full Moon is always on it.
 */
export function trailWindow(anchor: number): { t0: number; t1: number } {
  return { t0: anchor - TRAIL_PAST_DAYS * DAY_MS, t1: anchor + TRAIL_COMING_DAYS * DAY_MS }
}

/** Where the path crosses the plane of the Earth's orbit (the nodes), interpolated linearly between samples. */
export function planeCrossings(track: readonly MoonPlace[]): (Omit<MoonPlace, 'latitude'> & { ascending: boolean })[] {
  const out: (Omit<MoonPlace, 'latitude'> & { ascending: boolean })[] = []
  for (let i = 1; i < track.length; i++) {
    const [a, b] = [track[i - 1], track[i]]
    if (a.latitude < 0 === b.latitude < 0) continue
    const f = a.latitude / (a.latitude - b.latitude)
    const lerp = (x: number, y: number) => x + f * (y - x)
    // elongation wraps at 360°: interpolate across the wrap
    const de = wrap180(b.elongation - a.elongation)
    out.push({
      time: lerp(a.time, b.time),
      ascending: b.latitude > a.latitude,
      elongation: wrap360(a.elongation + f * de),
      distanceKm: lerp(a.distanceKm, b.distanceKm),
    })
  }
  return out
}

/**
 * How close to the plane of the Earth's orbit (degrees of latitude) a New or
 * Full Moon must be for some eclipse: in 1850–2149 every eclipse came within
 * 1.6°, and every New or Full Moon farther than 1.4° had none.
 */
export const ECLIPSE_LATITUDE = 1.5

/** the mean tilt of the Moon's orbit to the plane of the Earth's orbit, degrees */
export const INCLINATION = 5.145

/**
 * How far (degrees along the orbit) either side of a node the Moon stays within
 * ECLIPSE_LATITUDE of the plane: its height is about INCLINATION · sin(angle from the node).
 */
export const ECLIPSE_NODE_DISTANCE = (Math.asin(ECLIPSE_LATITUDE / INCLINATION) * 180) / Math.PI

/**
 * The direction (elongation, degrees) of the true perigee or apogee at `time`,
 * turning evenly from one of the given apsides (of one kind, sorted) to the
 * next, so that the line passes through each when the Moon gets there.
 * The mean perigee of `meanElements` is smoother but up to ±25° off (evection).
 */
export function apsisDirection(
  places: readonly { time: number; elongation: number }[],
  time: number,
): number | undefined {
  const i = places.findIndex((p) => p.time >= time)
  if (i < 0) return undefined
  if (places[i].time === time) return wrap360(places[i].elongation)
  if (i === 0) return undefined
  const [a, b] = [places[i - 1], places[i]]
  const f = (time - a.time) / (b.time - a.time)
  return wrap360(a.elongation + f * wrap180(b.elongation - a.elongation))
}
