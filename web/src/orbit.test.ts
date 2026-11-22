import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { RawCatalog } from './data/catalog'
import { ECLIPSE_LATITUDE, ECLIPSE_NODE_DISTANCE, apsisDirection, lineToSun, meanElements, phaseName, planeCrossings, trailWindow, moonPlace, moonTrack, orbitFrame, wrap180, wrap360 } from './orbit'
import { utc } from './test/fixture'
import { BEAT_DAYS } from './timeline'

const DAY = 86_400_000
const ECLIPSE_YEAR_DAYS = 346.62

describe('angles', () => {
  it('wraps', () => {
    expect(wrap360(-30)).toBe(330)
    expect(wrap360(725)).toBe(5)
    expect(wrap180(190)).toBe(-170)
    expect(wrap180(-190)).toBe(170)
  })

  it('measures how far a line is from pointing at the Sun', () => {
    expect(lineToSun(0)).toBe(0)
    expect(lineToSun(180)).toBe(0)
    expect(lineToSun(170)).toBe(10)
    expect(lineToSun(-100)).toBe(80)
    expect(lineToSun(90)).toBe(90)
  })
})

describe('phaseName', () => {
  it('names the eight phases by the angle from the Sun', () => {
    expect([0, 10, 45, 95, 130, 182, 225, 270, 300, 355].map(phaseName)).toEqual([
      'New Moon',
      'New Moon',
      'waxing crescent',
      'first quarter',
      'waxing gibbous',
      'Full Moon',
      'waning gibbous',
      'last quarter',
      'waning crescent',
      'New Moon',
    ])
  })
})

describe('trailWindow', () => {
  const SYNODIC_DAYS = 29.530589
  it('slides with the moment: some days back, some ahead', () => {
    const { t0, t1 } = trailWindow(100 * DAY)
    expect(t0).toBeLessThan(100 * DAY)
    expect(t1).toBeGreaterThan(100 * DAY)
    expect(trailWindow(101 * DAY)).toEqual({ t0: t0 + DAY, t1: t1 + DAY })
  })

  it('draws almost a whole round in the frame of the Sun without overlapping', () => {
    const { t0, t1 } = trailWindow(0)
    expect((t1 - t0) / DAY).toBeLessThan(SYNODIC_DAYS)
    expect((t1 - t0) / DAY).toBeGreaterThan(SYNODIC_DAYS - 1)
  })

  it('always reaches the next New or Full Moon (at most half a synodic month ahead)', () => {
    expect(trailWindow(0).t1 / DAY).toBeGreaterThan(SYNODIC_DAYS / 2)
  })
})

describe('eclipse zone', () => {
  it('uses the band where all eclipses of 1850–2149 happened', () => {
    // every eclipse had |latitude| < 1.6°, every New/Full Moon without one > 1.4°
    expect(ECLIPSE_LATITUDE).toBeGreaterThan(1.4)
    expect(ECLIPSE_LATITUDE).toBeLessThan(1.6)
  })

  it('reaches about 17° either side of a node (orbit tilted by 5.145°)', () => {
    expect(ECLIPSE_NODE_DISTANCE).toBeCloseTo((Math.asin(1.5 / 5.145) * 180) / Math.PI, 6)
    expect(ECLIPSE_NODE_DISTANCE).toBeCloseTo(16.95, 1)
  })

  it('matches the true height of the Moon near the nodes', () => {
    // over two years, every place within the zone is within ~1.5° of the plane and vice versa
    for (const p of moonTrack(Date.UTC(2026, 0, 1), Date.UTC(2028, 0, 1), 12)) {
      const fromNode = Math.abs(wrap180(p.elongation - orbitFrame(p.time).node))
      const nearNode = Math.min(fromNode, 180 - fromNode)
      if (nearNode < ECLIPSE_NODE_DISTANCE - 3) expect(Math.abs(p.latitude)).toBeLessThan(1.7)
      if (nearNode > ECLIPSE_NODE_DISTANCE + 3) expect(Math.abs(p.latitude)).toBeGreaterThan(1.3)
    }
  })
})

describe('apsisDirection', () => {
  const places = [
    { time: 0, elongation: 350 },
    { time: 10, elongation: 10 },
    { time: 30, elongation: 50 },
  ]
  it('points at each apsis at its time', () => {
    expect(places.map((p) => apsisDirection(places, p.time))).toEqual([350, 10, 50])
  })

  it('turns evenly in between, also across 0°', () => {
    expect(apsisDirection(places, 5)).toBeCloseTo(0)
    expect(apsisDirection(places, 20)).toBeCloseTo(30)
  })

  it('is unknown outside the apsides given', () => {
    expect(apsisDirection(places, -1)).toBeUndefined()
    expect(apsisDirection(places, 31)).toBeUndefined()
  })
})

describe('planeCrossings', () => {
  it('finds where the latitude changes sign, interpolated', () => {
    const p = (time: number, latitude: number) => ({ time, latitude, elongation: time, distanceKm: 380_000 })
    const track = [p(0, -1), p(10, 1), p(20, 3), p(30, -1)]
    expect(planeCrossings(track)).toEqual([
      { time: 5, ascending: true, elongation: 5, distanceKm: 380_000 },
      { time: 27.5, ascending: false, elongation: 27.5, distanceKm: 380_000 },
    ])
  })
})

describe('meanElements', () => {
  it("matches Meeus's example 47.a (1992-04-12 0h)", () => {
    // L′ = 134.290182°, M′ = 5.150833°, F = 219.889721°: perigee = L′ − M′, node = L′ − F
    const { perigee, node } = meanElements(utc('1992-04-12T00:00'))
    expect(perigee).toBeCloseTo(134.290182 - 5.150833, 2)
    expect(node).toBeCloseTo(134.290182 - 219.889721 + 360, 2)
  })

  it('turns the perigee forward once in 8.85 years and the node back once in 18.6 years', () => {
    const t = utc('2000-01-01T12:00')
    expect(wrap180(meanElements(t + 3231.5 * DAY).perigee - meanElements(t).perigee)).toBeCloseTo(0, 1)
    expect(wrap180(meanElements(t + 6798.4 * DAY).node - meanElements(t).node)).toBeCloseTo(0, 1)
    expect(wrap180(meanElements(t + 100 * DAY).node - meanElements(t).node)).toBeCloseTo(-5.3, 1)
  })
})

describe('moonPlace', () => {
  it('puts the New Moon at the Sun and the Full Moon opposite, at the catalog distance', () => {
    const fresh = moonPlace(utc('2023-01-21T20:53:15'))
    expect(Math.abs(wrap180(fresh.elongation))).toBeLessThan(0.05)
    expect(fresh.distanceKm).toBeCloseTo(356_569, -2)
    const full = moonPlace(utc('2023-01-06T23:07:54'))
    expect(full.elongation).toBeCloseTo(180, 1)
    expect(full.distanceKm).toBeCloseTo(405_791, -2)
  })

  it('samples a track including both ends', () => {
    const track = moonTrack(0, 10 * 3_600_000, 4)
    expect(track.map((p) => p.time / 3_600_000)).toEqual([0, 4, 8, 10])
  })
})

describe('orbitFrame: the frame of the Sun', () => {
  const t = utc('2023-01-21T20:53:15')
  // the Sun's uneven motion (±2°) blurs the mean rates a little

  it('turns the line of apsides once per beat, backwards', () => {
    const a = orbitFrame(t).perigee
    expect(Math.abs(wrap180(orbitFrame(t + BEAT_DAYS * DAY).perigee - a))).toBeLessThan(3)
    expect(wrap180(orbitFrame(t + (BEAT_DAYS / 4) * DAY).perigee - a)).toBeCloseTo(-90, -1)
  })

  it('turns the line of nodes once per eclipse year, backwards', () => {
    const n = orbitFrame(t).node
    expect(Math.abs(wrap180(orbitFrame(t + ECLIPSE_YEAR_DAYS * DAY).node - n))).toBeLessThan(3)
    expect(wrap180(orbitFrame(t + (ECLIPSE_YEAR_DAYS / 4) * DAY).node - n)).toBeCloseTo(-90, -1)
  })

  it('has the line of apsides pointing at the Sun at the alignment of 2023-01-21', () => {
    expect(lineToSun(orbitFrame(t).perigee)).toBeLessThan(25)
  })
})

const realDataPath = resolve(process.cwd(), 'public/data/lunar-events.json')

describe.runIf(existsSync(realDataPath))('against the catalog (JPL DE440s), 1850-2149', () => {
  const raw = JSON.parse(readFileSync(realDataPath, 'utf-8')) as RawCatalog & {
    nodes: { t: number[]; kind: number[] }
  }
  // every 7th event keeps the test quick
  const sample = <T,>(xs: T[]) => xs.filter((_, i) => i % 7 === 0)

  it('crosses the ecliptic at the catalog nodes, within 2° of the mean node', () => {
    for (const i of sample(raw.nodes.t.map((_, i) => i))) {
      const time = raw.nodes.t[i] * 1000
      const place = moonPlace(time)
      expect(Math.abs(place.latitude)).toBeLessThan(0.02)
      const ascending = raw.nodes.kind[i] === 1
      expect(Math.abs(wrap180(place.elongation - orbitFrame(time).node - (ascending ? 0 : 180)))).toBeLessThan(2)
    }
  })

  it('reaches perigee within 26° of the mean perigee and apogee within 6° of the opposite', () => {
    for (const i of sample(raw.apsides.t.map((_, i) => i))) {
      const time = raw.apsides.t[i] * 1000
      const perigee = raw.apsides.kind[i] === 0
      const off = Math.abs(wrap180(moonPlace(time).elongation - orbitFrame(time).perigee - (perigee ? 0 : 180)))
      expect(off).toBeLessThan(perigee ? 26 : 6)
    }
  })

  it('agrees on the distance at New and Full Moons within 30 km', () => {
    for (const i of sample(raw.syzygies.t.map((_, i) => i))) {
      expect(Math.abs(moonPlace(raw.syzygies.t[i] * 1000).distanceKm - raw.syzygies.distance_km[i])).toBeLessThan(30)
    }
  })

  it('has eclipses only at New and Full Moons within about 1.5° of the plane', () => {
    // 1850-2149: every eclipse within 1.6°, every New or Full Moon without one beyond 1.4°;
    // between, it depends on the distances of the Moon and the Sun
    const s = raw.syzygies
    for (let i = 0; i < s.t.length; i++) {
      const height = Math.abs(moonPlace(s.t[i] * 1000).latitude)
      const eclipse = s.lunar_eclipse[i] >= 0 || s.solar_eclipse[i] >= 0
      if (eclipse) expect(height).toBeLessThan(1.6)
      else expect(height).toBeGreaterThan(1.4)
    }
  })
})
