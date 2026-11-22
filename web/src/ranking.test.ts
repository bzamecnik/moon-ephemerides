import { describe, expect, it } from 'vitest'
import { decodeCatalog } from './data/catalog'
import { moonEvents } from './events'
import { bestAlignments, ERAS } from './ranking'
import { rawFixture } from './test/fixture'

const events = moonEvents(decodeCatalog(rawFixture).syzygies)

describe('bestAlignments', () => {
  it('ranks super- and micromoons by how close Δ is to zero', () => {
    const ranked = bestAlignments(events, { from: 2022, to: 2023 }, 3)
    expect(ranked.map((e) => e.deltaDays)).toEqual([0.0027, -0.9168, 0.9236])
  })

  it('keeps only the years of the era', () => {
    expect(bestAlignments(events, { from: 2023, to: 2023 }, 10)).toHaveLength(4)
    expect(bestAlignments(events, { from: 1901, to: 2000 }, 10)).toHaveLength(0)
  })

  it('offers the centuries of the data', () => {
    expect(ERAS.map((e) => e.label)).toContain('2001–2100')
  })
})
