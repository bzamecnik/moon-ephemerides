import { describe, expect, it } from 'vitest'
import { closestIndex, firstIndexAtOrAfter, stepAnchor, windowAround } from './timeline'

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

describe('closestIndex', () => {
  it('finds the nearest event on either side', () => {
    expect([0, 14, 16, 26, 99].map((t) => closestIndex(times, t))).toEqual([0, 0, 1, 2, 4])
  })

  it('prefers the earlier one in a tie', () => {
    expect(closestIndex(times, 25)).toBe(1)
  })

  it('is -1 without events', () => {
    expect(closestIndex([], 5)).toBe(-1)
  })
})

describe('stepAnchor', () => {
  it('moves to the event after or before the closest one', () => {
    expect(stepAnchor(times, 22, 1)).toBe(30)
    expect(stepAnchor(times, 22, -1)).toBe(10)
    expect(stepAnchor(times, 28, 1)).toBe(40)
  })

  it('stops at the ends', () => {
    expect(stepAnchor(times, 25, -10)).toBe(10)
    expect(stepAnchor(times, 25, 10)).toBe(50)
  })
})
