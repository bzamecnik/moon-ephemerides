import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { decodeCatalog, type RawCatalog } from './data/catalog'
import { distanceAt, sampleDistance } from './distance'
import { rawFixture } from './test/fixture'

const { apsides } = decodeCatalog(rawFixture)

describe('distanceAt', () => {
  it('is exact at perigee and apogee', () => {
    expect(distanceAt(apsides, apsides[1].time)).toBe(358270)
    expect(distanceAt(apsides, apsides[2].time)).toBe(406458)
  })

  it('follows half a cosine wave in between: the mean halfway, flat near the ends', () => {
    const [a, b] = [apsides[1], apsides[2]]
    expect(distanceAt(apsides, (a.time + b.time) / 2)).toBeCloseTo((358270 + 406458) / 2, 6)
    const nearStart = distanceAt(apsides, a.time + 0.05 * (b.time - a.time))!
    expect(nearStart - 358270).toBeLessThan(0.01 * (406458 - 358270))
  })

  it('is null outside the data', () => {
    expect(distanceAt(apsides, apsides[0].time - 1)).toBeNull()
  })
})

describe('sampleDistance', () => {
  it('samples at a regular step', () => {
    const day = 86_400_000
    const points = sampleDistance(apsides, apsides[1].time, apsides[1].time + 10 * day, day)
    expect(points).toHaveLength(11)
    expect(points[0].km).toBe(358270)
  })
})

const realDataPath = resolve(process.cwd(), 'public/data/lunar-events.json')

describe.runIf(existsSync(realDataPath))('against the true distances of all New and Full Moons', () => {
  const catalog = decodeCatalog(JSON.parse(readFileSync(realDataPath, 'utf-8')) as RawCatalog)
  const errors = catalog.syzygies
    .map((s) => distanceAt(catalog.apsides, s.time))
    .map((d, i) => (d === null ? null : Math.abs(d - catalog.syzygies[i].distanceKm)))
    .filter((e): e is number => e !== null)
    .sort((a, b) => a - b)

  it('is mostly within a few hundred km, never off by more than 4500 km', () => {
    expect(errors.length).toBeGreaterThan(7000)
    expect(errors[errors.length >> 1]).toBeLessThan(500)
    expect(errors.at(-1)).toBeLessThan(4500)
  })
})
