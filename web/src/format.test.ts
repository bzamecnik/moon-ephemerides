import { describe, expect, it } from 'vitest'
import {
  formatDate,
  formatDateTime,
  formatDelta,
  formatDuration,
  formatRelative,
  formatOffset,
  formatZoned,
  parseDateTime,
  parseHash,
  parseHashPage,
  parseHashView,
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
    expect(parseDateTime('2023-01-21', 'utc')).toBe(utc('2023-01-21T00:00'))
    expect(parseDateTime('2023-01-21', 'local')).toBe(utc('2023-01-20T23:00'))
    expect(parseDateTime('not a date', 'utc')).toBeNull()
  })

  it('accepts a year or a year and month alone', () => {
    expect(parseDateTime('1989', 'utc')).toBe(utc('1989-01-01T00:00'))
    expect(parseDateTime('1989-05', 'utc')).toBe(utc('1989-05-01T00:00'))
    expect(parseDateTime('1989-5-7', 'utc')).toBe(utc('1989-05-07T00:00'))
    expect(parseDateTime(' 1989-05-07 ', 'utc')).toBe(utc('1989-05-07T00:00'))
  })

  it('does not map years below 100 to the 1900s', () => {
    expect(new Date(parseDateTime('0001-01-10', 'utc')!).getUTCFullYear()).toBe(1)
    expect(new Date(parseDateTime('0019-01-10', 'local')!).getFullYear()).toBe(19)
  })

  it('accepts a time of day after the date', () => {
    expect(parseDateTime('2023-02-06 13:45', 'utc')).toBe(utc('2023-02-06T13:45'))
    expect(parseDateTime('2023-02-06T13:45', 'utc')).toBe(utc('2023-02-06T13:45'))
    expect(parseDateTime('2023-02-06 7', 'utc')).toBe(utc('2023-02-06T07:00'))
    expect(parseDateTime('2023-02-06 13:45', 'local')).toBe(utc('2023-02-06T12:45'))
    expect(parseDateTime('2023-02-06 24:00', 'utc')).toBeNull()
    expect(parseDateTime('2023-02-06 13:60', 'utc')).toBeNull()
    expect(parseDateTime('2023-02-06 13:', 'utc')).toBeNull()
    expect(parseDateTime('2023-02 13:45', 'utc')).toBeNull()
  })

  it('rejects impossible and unfinished dates', () => {
    expect(parseDateTime('2023-02-30', 'utc')).toBeNull()
    expect(parseDateTime('2023-13', 'utc')).toBeNull()
    expect(parseDateTime('2023-00', 'utc')).toBeNull()
    expect(parseDateTime('198', 'utc')).toBeNull()
    expect(parseDateTime('1989-', 'utc')).toBeNull()
  })
})

describe('time zones', () => {
  it('gives the UTC offset of local time at a moment (with summer time)', () => {
    expect(formatOffset(utc('2023-01-21T12:00'))).toBe('UTC+1')
    expect(formatOffset(utc('2023-07-21T12:00'))).toBe('UTC+2')
  })

  it('rounds historical local mean time offsets to whole minutes', () => {
    // Prague used its local mean time, UTC+0:57:44, until 1891
    expect(formatOffset(utc('1850-06-01T12:00'))).toBe('UTC+0:58')
  })

  it('formats a time with its zone', () => {
    expect(formatZoned(t, 'utc')).toBe('2023-01-21 20:53 UTC')
    expect(formatZoned(t, 'local')).toBe('2023-01-21 21:53 (UTC+1)')
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
    expect(formatDuration(-3.25)).toBe('−3.3 d')
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
  it('keeps the selected moment in UTC, the time only when not midnight', () => {
    expect(formatHash(utc('2023-01-21T00:00'))).toBe('#date=2023-01-21')
    expect(formatHash(utc('2023-01-21T13:45:20'))).toBe('#date=2023-01-21T13:45')
    expect(parseHash('#date=2023-01-21')).toBe(utc('2023-01-21T00:00'))
    expect(parseHash('#date=2023-01-21T13:45')).toBe(utc('2023-01-21T13:45'))
    expect(parseHash('')).toBeNull()
    expect(parseHash('#date=garbage')).toBeNull()
  })

  it('also keeps the view, unless it is the default one', () => {
    expect(formatHash(utc('2023-01-21T00:00'), 'beat')).toBe('#date=2023-01-21&view=beat')
    expect(formatHash(utc('2023-01-21T00:00'), 'table')).toBe('#date=2023-01-21')
    expect(parseHashView('#date=2023-01-21&view=beat')).toBe('beat')
    expect(parseHash('#date=2023-01-21&view=beat')).toBe(utc('2023-01-21T00:00'))
    expect(parseHashView('#date=2023-01-21')).toBeNull()
  })

  it('tells the learning page from the explorer', () => {
    expect(parseHashPage('#learn')).toEqual({ page: 'learn' })
    expect(parseHashPage('#about')).toEqual({ page: 'about' })
    expect(parseHashPage('#learn-nodes-and-eclipses')).toEqual({ page: 'learn', section: 'learn-nodes-and-eclipses' })
    expect(parseHashPage('#date=2023-01-21&view=beat')).toEqual({ page: 'explore' })
    expect(parseHashPage('')).toEqual({ page: 'explore' })
  })
})
