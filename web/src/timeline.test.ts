import { describe, expect, it } from 'vitest'
import { firstIndexAtOrAfter, stepAnchor, windowAround } from './timeline'

const times = [10, 20, 30, 40, 50]

describe('firstIndexAtOrAfter', () => {
  it('finds the next event, counting one exactly at the moment', () => {
    expect([0, 10, 11, 30, 50, 51].map((t) => firstIndexAtOrAfter(times, t))).toEqual([0, 0, 1, 2, 4, 5])
  })
})

describe('windowAround', () => {
  it('takes some events before and after the next one', () => {
    expect(windowAround(times.length, 2, 1, 2)).toEqual({ start: 1, end: 4 })
  })

  it('is clipped at both ends', () => {
    expect(windowAround(times.length, 0, 3, 3)).toEqual({ start: 0, end: 3 })
    expect(windowAround(times.length, 5, 3, 3)).toEqual({ start: 2, end: 5 })
  })
})

describe('stepAnchor', () => {
  it('moving forward by one makes the following event the next one', () => {
    const anchor = stepAnchor(times, 25, 1) // next was 30 (index 2)
    expect(firstIndexAtOrAfter(times, anchor)).toBe(3)
  })

  it('moving back by one makes the previous event the next one', () => {
    const anchor = stepAnchor(times, 25, -1)
    expect(firstIndexAtOrAfter(times, anchor)).toBe(1)
  })

  it('stops at the ends', () => {
    expect(firstIndexAtOrAfter(times, stepAnchor(times, 25, -10))).toBe(0)
    expect(firstIndexAtOrAfter(times, stepAnchor(times, 25, 10))).toBe(5)
  })
})
