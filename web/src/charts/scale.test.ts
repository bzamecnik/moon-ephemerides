import { describe, expect, it } from 'vitest'
import { linearScale, yearTicks } from './scale'

describe('linearScale', () => {
  it('maps a domain onto a range, also reversed', () => {
    const s = linearScale([0, 10], [100, 200])
    expect([s(0), s(5), s(10)]).toEqual([100, 150, 200])
    const y = linearScale([-15, 15], [300, 0])
    expect(y(0)).toBe(150)
  })
})

describe('yearTicks', () => {
  const t = (y: number) => Date.parse(`${y}-01-01T00:00Z`)

  it('puts ticks on New Year with a round step', () => {
    expect(yearTicks(t(2020) + 1, t(2026) + 1, 8).map((ms) => new Date(ms).getUTCFullYear())).toEqual([
      2021, 2022, 2023, 2024, 2025, 2026,
    ])
    expect(yearTicks(t(1900), t(1960), 8).map((ms) => new Date(ms).getUTCFullYear())).toEqual([
      1900, 1910, 1920, 1930, 1940, 1950, 1960,
    ])
  })

  it('falls back to months within a year', () => {
    const ticks = yearTicks(Date.parse('2023-01-15T00:00Z'), Date.parse('2023-07-15T00:00Z'), 8)
    expect(ticks.map((ms) => new Date(ms).toISOString().slice(0, 7))).toEqual([
      '2023-02',
      '2023-03',
      '2023-04',
      '2023-05',
      '2023-06',
      '2023-07',
    ])
  })
})
