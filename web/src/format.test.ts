import { describe, expect, it } from 'vitest'
import {
  formatDate,
  formatDateTime,
  formatDelta,
  formatDuration,
  formatRelative,
  parseDate,
  parseHash,
  formatHash,
} from './format'
import { utc } from './test/fixture'

// vitest runs with TZ=Europe/Prague (vite.config.ts)
const t = utc('2023-01-21T20:53:15')

describe('dates', () => {
  it('formats in UTC or local time', () => {
    expect(formatDateTime(t, 'utc')).toBe('2023-01-21 20:53')
    expect(formatDateTime(t, 'local')).toBe('2023-01-21 21:53')
    expect(formatDate(utc('2023-01-21T23:30'), 'utc')).toBe('2023-01-21')
    expect(formatDate(utc('2023-01-21T23:30'), 'local')).toBe('2023-01-22')
  })

  it('rounds to the nearest minute, like the astropixels tables', () => {
    expect(formatDateTime(utc('2023-01-21T20:57:31'), 'utc')).toBe('2023-01-21 20:58')
    expect(formatDateTime(utc('2023-01-21T20:57:29'), 'utc')).toBe('2023-01-21 20:57')
    expect(formatDateTime(utc('2023-12-31T23:59:45'), 'utc')).toBe('2024-01-01 00:00')
  })

  it('formats years before 1970 and after 2100', () => {
    expect(formatDateTime(utc('1850-01-02T03:04'), 'utc')).toBe('1850-01-02 03:04')
    expect(formatDateTime(utc('2149-12-31T23:59'), 'utc')).toBe('2149-12-31 23:59')
  })

  it('parses a date as the start of that day', () => {
    expect(parseDate('2023-01-21', 'utc')).toBe(utc('2023-01-21T00:00'))
    expect(parseDate('2023-01-21', 'local')).toBe(utc('2023-01-20T23:00'))
    expect(parseDate('not a date', 'utc')).toBeNull()
  })
})

describe('durations', () => {
  it('shows Δ in days with a sign', () => {
    expect(formatDelta(0.0027)).toBe('+0.003')
    expect(formatDelta(-1.3985)).toBe('−1.399')
  })

  it('says a duration in plain units', () => {
    expect(formatDuration(0.0027)).toBe('+4 min')
    expect(formatDuration(-0.5)).toBe('−12.0 h')
    expect(formatDuration(1.4246)).toBe('+34.2 h')
    expect(formatDuration(-3.25)).toBe('−3.3 days')
  })

  it('says how far an event is from the selected moment', () => {
    const day = 86_400_000
    expect(formatRelative(t + 3 * 3_600_000, t)).toBe('in 3 hours')
    expect(formatRelative(t - 5 * day, t)).toBe('5 days ago')
    expect(formatRelative(t + 1 * day + 1000, t)).toBe('in 1 day')
    expect(formatRelative(t + 100 * day, t)).toBe('in 3 months')
    expect(formatRelative(t - 1000 * day, t)).toBe('2.7 years ago')
    expect(formatRelative(t + 60_000, t)).toBe('now')
  })
})

describe('URL hash', () => {
  it('round-trips the selected date', () => {
    expect(formatHash('2023-01-21')).toBe('#date=2023-01-21')
    expect(parseHash('#date=2023-01-21')).toBe('2023-01-21')
    expect(parseHash('')).toBeNull()
    expect(parseHash('#date=garbage')).toBeNull()
  })
})
