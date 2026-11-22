import { describe, expect, it } from 'vitest'
import type { Syzygy } from './data/catalog'
import { classify } from './events'
import { ALL, applyFilter, describeFilter, ECLIPSE_KEYS, MOON_KINDS, toggle, type Filter } from './filters'

const syzygy = (time: number, phase: 'new' | 'full', r: number, eclipse: Syzygy['eclipse'] = null): Syzygy => ({
  time,
  phase,
  distanceKm: 380_000,
  perigeeDeltaDays: 0,
  apogeeDeltaDays: 14,
  relativeDistance: r,
  eclipse,
})
const events = [
  syzygy(1, 'new', 0.05, { body: 'solar', kind: 'total' }),
  syzygy(2, 'full', 0.5),
  syzygy(3, 'new', 0.95, { body: 'solar', kind: 'annular' }),
  syzygy(4, 'full', 0.95, { body: 'lunar', kind: 'penumbral' }),
  syzygy(5, 'new', 0.5),
].map(classify)
const times = (f: Filter) => applyFilter(events, f).map((e) => e.syzygy.time)

describe('filters', () => {
  it('shows everything by default', () => {
    expect(times(ALL)).toEqual([1, 2, 3, 4, 5])
    expect(describeFilter(ALL)).toBe('all')
  })

  it('keeps the chosen kinds of New and Full Moons', () => {
    const f = { ...ALL, moons: toggle(toggle(ALL.moons, 'full-ordinary'), 'new-ordinary') }
    expect(times(f)).toEqual([1, 3, 4])
    expect(describeFilter(f)).toBe('4 of 6 kinds')
  })

  it('keeps only eclipses, of the chosen kinds', () => {
    const only = { ...ALL, onlyEclipses: true }
    expect(times(only)).toEqual([1, 3, 4])
    expect(describeFilter(only)).toBe('eclipses')
    const noPenumbral = { ...only, eclipses: toggle(only.eclipses, 'lunar-penumbral') }
    expect(times(noPenumbral)).toEqual([1, 3])
    expect(describeFilter(noPenumbral)).toBe('5 of 6 eclipse kinds')
    const superOnly = { ...only, moons: new Set(MOON_KINDS.filter((k) => k.endsWith('super'))) }
    expect(times(superOnly)).toEqual([1])
    expect(describeFilter(superOnly)).toBe('eclipses, 2 of 6 kinds')
  })

  it('names six moon kinds and six eclipse kinds', () => {
    expect(MOON_KINDS).toHaveLength(6)
    expect(ECLIPSE_KEYS).toEqual([
      'solar-total',
      'solar-annular',
      'solar-partial',
      'lunar-total',
      'lunar-partial',
      'lunar-penumbral',
    ])
  })
})
