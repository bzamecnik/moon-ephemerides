import { describe, expect, it } from 'vitest'
import { decodeCatalog } from './data/catalog'
import { beatLines, beatPoints } from './beat'
import { moonEvents } from './events'
import { rawFixture, utc } from './test/fixture'

const events = moonEvents(decodeCatalog(rawFixture).syzygies, { includeOrdinary: true })

describe('beatPoints', () => {
  it('places every New/Full Moon in the span at its Δ to the nearest perigee', () => {
    const points = beatPoints(events, utc('2023-01-01T00:00'), utc('2023-02-28T00:00'))
    expect(points.map((p) => p.delta)).toEqual([-13.6119, 0.0027, 13.6091, -0.9168])
    expect(points[1].event.kind).toBe('super')
  })
})

describe('beatLines', () => {
  it('joins New Moons with New Moons and Full with Full, breaking where Δ wraps around', () => {
    const lines = beatLines(beatPoints(events, utc('2022-12-01T00:00'), utc('2023-03-01T00:00')))
    const deltas = lines.map((line) => line.map((p) => p.delta))
    // New Moons: 0.92, 0.003, -0.92 (a straight run); Full Moons: -12.1, -13.6 | 13.6 (wraps)
    expect(deltas).toEqual([[0.9236, 0.0027, -0.9168], [-12.109, -13.6119], [13.6091]])
  })
})
