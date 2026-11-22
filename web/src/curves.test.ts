import { describe, expect, it } from 'vitest'
import { smoothThrough } from './curves'

describe('smoothThrough', () => {
  const period = 412
  const f = (t: number) => Math.cos((2 * Math.PI * t) / period)
  // one sample a month of a wave with a beat-long period, as New Moon distances
  const points = Array.from({ length: 30 }, (_, i) => ({ time: i * 29.53, value: f(i * 29.53) }))

  it('passes through the points', () => {
    const curve = smoothThrough(points, 4)
    for (const p of points) expect(curve).toContainEqual(p)
    expect(curve).toHaveLength(29 * 4 + 1)
  })

  it('follows a smooth wave much better than straight lines', () => {
    const curve = smoothThrough(points, 8).filter((p) => p.time > 30 && p.time < 28 * 29.53)
    const maxError = Math.max(...curve.map((p) => Math.abs(p.value - f(p.time))))
    // straight lines between monthly samples miss the wave by up to 1 - cos(π·29.53/412) ≈ 0.025
    expect(maxError).toBeLessThan(0.003)
  })

  it('handles uneven spacing and the ends', () => {
    expect(smoothThrough([{ time: 0, value: 1 }], 4)).toEqual([{ time: 0, value: 1 }])
    const two = smoothThrough(
      [
        { time: 0, value: 0 },
        { time: 2, value: 2 },
      ],
      2,
    )
    expect(two).toEqual([
      { time: 0, value: 0 },
      { time: 1, value: 1 },
      { time: 2, value: 2 },
    ])
  })
})
