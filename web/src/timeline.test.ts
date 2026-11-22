import { describe, expect, it } from 'vitest'
import { BEAT_DAYS, closestIndex, firstIndexAtOrAfter, stepAnchor, stepByTime, windowAround } from './timeline'

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
  it('moves to the next event after the moment, or the last one before it', () => {
    expect(stepAnchor(times, 22, 1)).toBe(30)
    expect(stepAnchor(times, 22, -1)).toBe(20)
    // the closest event (30) is ahead: "next" is that one, not the one after
    expect(stepAnchor(times, 28, 1)).toBe(30)
    expect(stepAnchor(times, 28, -1)).toBe(20)
    expect(stepAnchor(times, 25, 2)).toBe(40)
    expect(stepAnchor(times, 25, -2)).toBe(10)
  })

  it('moves on from an event the moment is at', () => {
    expect(stepAnchor(times, 30, 1)).toBe(40)
    expect(stepAnchor(times, 30, -1)).toBe(20)
  })

  it('stops at the ends', () => {
    expect(stepAnchor(times, 25, -10)).toBe(10)
    expect(stepAnchor(times, 25, 10)).toBe(50)
  })
})

describe('stepByTime', () => {
  const DAY = 86_400_000
  // every New and Full Moon: half a synodic month apart
  const syzygies = Array.from({ length: 200 }, (_, i) => i * 14.765 * DAY)

  it('one beat later is the same phase 14 synodic months later', () => {
    expect(BEAT_DAYS).toBeCloseTo(411.78, 1)
    expect(stepByTime(syzygies, syzygies[10], BEAT_DAYS * DAY)).toBe(syzygies[38])
    expect(stepByTime(syzygies, syzygies[38] + 3 * DAY, -BEAT_DAYS * DAY)).toBe(syzygies[10])
  })

  it('moves at least one event even when the nearest one to the target is the current one', () => {
    const sparse = [0, 1000 * DAY, 2000 * DAY]
    expect(stepByTime(sparse, 0, BEAT_DAYS * DAY)).toBe(1000 * DAY)
    expect(stepByTime(sparse, 1000 * DAY, -BEAT_DAYS * DAY)).toBe(0)
  })

  it('stays at the ends', () => {
    expect(stepByTime(syzygies, syzygies[199], BEAT_DAYS * DAY)).toBe(syzygies[199])
    expect(stepByTime([], 5, DAY)).toBe(5)
  })
})
