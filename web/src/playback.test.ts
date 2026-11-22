import { describe, expect, it } from 'vitest'
import { cycleStep, nextPlayAnchor, playInterval, PLAY_STEPS } from './playback'
import { BEAT_DAYS } from './timeline'

const DAY = 86_400_000
// New/Full Moons every half synodic month for ten years
const times = Array.from({ length: 250 }, (_, i) => i * 14.765 * DAY)
const last = times.at(-1)!

describe('nextPlayAnchor', () => {
  it('moves by a fixed time', () => {
    expect(nextPlayAnchor('hours', 0, times, 0)).toBe(6 * 3_600_000)
    expect(nextPlayAnchor('day', 0, times, 0)).toBe(DAY)
    expect(nextPlayAnchor('week', 0, times, 0)).toBe(7 * DAY)
    expect(nextPlayAnchor('month', 0, times, 0)).toBeCloseTo(29.530589 * DAY, -1)
  })

  it('moves by a beat to the event of the same phase', () => {
    const next = nextPlayAnchor('beat', 0, times, 0)!
    expect(Math.abs(next - BEAT_DAYS * DAY)).toBeLessThan(7.5 * DAY)
    expect(times).toContain(next)
  })

  it('stops at the end of the data', () => {
    expect(nextPlayAnchor('week', last - DAY, times, 0)).toBeNull()
    expect(nextPlayAnchor('beat', last, times, 0)).toBeNull()
  })

  it('follows the clock when live', () => {
    expect(nextPlayAnchor('live', 0, times, 12345)).toBe(12345)
  })
})

describe('play steps', () => {
  it('animates fast, but live only once a minute', () => {
    expect(playInterval('beat')).toBe(100)
    expect(playInterval('live')).toBe(60_000)
  })

  it('cycles from the smallest step to the largest, live left out', () => {
    expect(PLAY_STEPS.map((s) => s.id)).toEqual(['hours', 'day', 'week', 'month', 'beat', 'live'])
    expect(cycleStep('day', 1)).toBe('week')
    expect(cycleStep('day', -1)).toBe('hours')
    expect(cycleStep('hours', -1)).toBe('hours')
    expect(cycleStep('beat', 1)).toBe('beat')
    expect(cycleStep('live', -1)).toBe('beat')
  })
})
