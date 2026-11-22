import { describe, expect, it } from 'vitest'
import { decodeCatalog } from './data/catalog'
import { rawFixture, utc } from './test/fixture'
import { classify, moonEvents, eventLabel, apparentDiameterArcmin, eclipseLabel } from './events'

const { syzygies } = decodeCatalog(rawFixture)

describe('classify', () => {
  it('a supermoon is paired with its perigee', () => {
    const e = classify(syzygies[3])
    expect(e.kind).toBe('super')
    expect(e.apsis).toBe('perigee')
    expect(e.deltaDays).toBe(0.0027)
    expect(e.apsisTime).toBe(syzygies[3].time + 0.0027 * 86_400_000)
    // Espenak's printed value: 1 at the apsis
    expect(e.closeness).toBe(1)
  })

  it('a micromoon is paired with its apogee', () => {
    const e = classify(syzygies[4])
    expect(e.kind).toBe('micro')
    expect(e.apsis).toBe('apogee')
    expect(e.deltaDays).toBe(-1.3985)
    expect(e.closeness).toBe(0.9866)
  })

  it('an ordinary syzygy takes the apsis it is closer to in distance', () => {
    const e = classify(syzygies[0]) // relative distance 0.87: nearer apogee
    expect(e.kind).toBe('ordinary')
    expect(e.apsis).toBe('apogee')
    expect(e.deltaDays).toBe(3.8474)
  })
})

describe('moonEvents', () => {
  it('keeps only super- and micromoons by default, in time order', () => {
    const events = moonEvents(syzygies)
    expect(events.map(eventLabel)).toEqual([
      'New Supermoon',
      'Full Micromoon',
      'New Supermoon',
      'Full Micromoon',
      'New Supermoon',
    ])
  })

  it('can include ordinary New and Full Moons', () => {
    expect(moonEvents(syzygies, { includeOrdinary: true })).toHaveLength(6)
  })

  it('filters by the four kinds', () => {
    const events = moonEvents(syzygies, { kinds: new Set(['full-micro']) })
    expect(events.map((e) => e.syzygy.time)).toEqual([utc('2023-01-06T23:07:54'), utc('2023-02-05T18:28:34')])
  })
})

describe('apparentDiameterArcmin', () => {
  it('is about 31.08 arcmin at the mean distance', () => {
    expect(apparentDiameterArcmin(384_400)).toBeCloseTo(31.08, 2)
  })
})

describe('eclipseLabel', () => {
  it('names the kind and the body', () => {
    expect(eclipseLabel({ body: 'solar', kind: 'annular' })).toBe('annular solar eclipse')
    expect(eclipseLabel({ body: 'lunar', kind: 'penumbral' })).toBe('penumbral lunar eclipse')
  })
})
