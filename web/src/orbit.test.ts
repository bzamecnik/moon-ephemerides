import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { RawCatalog } from './data/catalog'
import { lineToSun, meanElements, phaseName, moonPlace, moonTrack, orbitFrame, wrap180, wrap360 } from './orbit'
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
})
