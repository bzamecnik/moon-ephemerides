import { describe, expect, it } from 'vitest'
import { decodeCatalog } from './data/catalog'
import { anomalisticMarks, phaseAt, samplePhases, splitAtWraps, synodicMarks } from './phase'
import { rawFixture, utc } from './test/fixture'

const catalog = decodeCatalog(rawFixture)
const syn = synodicMarks(catalog.syzygies)
const anom = anomalisticMarks(catalog.apsides)

describe('phaseAt', () => {
  it('is 0 at New Moon and 0.5 at Full Moon', () => {
    expect(phaseAt(syn, utc('2023-01-21T20:53:15'))).toBeCloseTo(0, 6)
    expect(phaseAt(syn, utc('2023-01-06T23:07:54'))).toBeCloseTo(0.5, 6)
  })

  it('interpolates linearly in time between the events', () => {
    const full = utc('2023-01-06T23:07:54')
    const next = utc('2023-01-21T20:53:15')
    expect(phaseAt(syn, (full + next) / 2)).toBeCloseTo(0.75, 6)
  })

  it('is 0 at perigee and 0.5 at apogee, wrapping into [0, 1)', () => {
    const perigee = 1674334626000
    expect(phaseAt(anom, perigee)).toBeCloseTo(0, 6)
    expect(phaseAt(anom, 1675500880000)).toBeCloseTo(0.5, 6)
    // New Moon 2023-01-21 is 4 minutes before perigee: just below 1
    const p = phaseAt(anom, utc('2023-01-21T20:53:15'))!
    expect(p).toBeGreaterThan(0.999)
    expect(p).toBeLessThan(1)
  })

  it('is null outside the data', () => {
    expect(phaseAt(syn, utc('2020-01-01T00:00'))).toBeNull()
    expect(phaseAt(syn, utc('2030-01-01T00:00'))).toBeNull()
  })
})

describe('samplePhases', () => {
  it('samples both phases at a regular step, skipping moments outside the data', () => {
    const day = 86_400_000
    const points = samplePhases(syn, anom, utc('2023-01-01T00:00'), utc('2023-01-31T00:00'), day)
    expect(points).toHaveLength(31)
    // a synodic month is longer than an anomalistic one: the distance phase runs ahead
    const [a, b] = [points[10], points[11]]
    expect(b.synodic - a.synodic).toBeCloseTo(1 / 29.53, 2)
    expect(b.anomalistic - a.anomalistic).toBeCloseTo(1 / 27.55, 2)
  })
})

describe('splitAtWraps', () => {
  it('breaks a line where a value jumps around the cycle', () => {
    const xs = [0.8, 0.9, 0.05, 0.15, 0.25]
    expect(splitAtWraps(xs, (a, b) => Math.abs(b - a) > 0.5)).toEqual([[0.8, 0.9], [0.05, 0.15, 0.25]])
  })
})
