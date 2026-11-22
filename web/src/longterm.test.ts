import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { decodeCatalog, type RawCatalog } from './data/catalog'
import { moonEvents } from './events'
import { bestAligned, extremes, nearestApsis, runs } from './longterm'
import { BEAT_DAYS } from './timeline'
import { rawFixture, utc } from './test/fixture'

const events = moonEvents(decodeCatalog(rawFixture).syzygies, { includeOrdinary: true })

describe('nearestApsis', () => {
  it('takes the perigee or apogee nearer in time', () => {
    expect(nearestApsis(events[3].syzygy)).toEqual({ apsis: 'perigee', delta: 0.0027 })
    expect(nearestApsis(events[4].syzygy)).toEqual({ apsis: 'apogee', delta: -1.3985 })
  })
})

describe('bestAligned', () => {
  it('picks the New or Full Moon nearest in time to an apsis among its neighbours', () => {
    const picks = bestAligned(events, 2) // the fixture is too short for the default ±3
    expect(picks.map((p) => p.event.syzygy.time)).toEqual([utc('2023-01-21T20:53:15')])
    expect(picks[0]).toMatchObject({ apsis: 'perigee', delta: 0.0027 })
  })
})

describe('extremes', () => {
  it('picks the supermoons closer than the same phase a month before and after', () => {
    expect(extremes(events, 'closest').map((e) => e.syzygy.distanceKm)).toEqual([356569])
  })

  it('needs both neighbours', () => {
    // the Full Micromoon of 2023-02-05 is the farthest so far, but the data ends there
    expect(extremes(events, 'farthest')).toEqual([])
  })
})

describe('runs', () => {
  const DAY = 86_400_000
  const beat = BEAT_DAYS * DAY
  // picks of two kinds taking turns every half beat
  const item = (k: number, key: string, value: number) => ({ time: (k * beat) / 2, key, value })
  const opts = { maxGapDays: 1.5 * BEAT_DAYS, maxJump: 0.25 }
  const keyOf = (i: { key: string }) => i.key

  it('joins picks of the same kind one beat apart', () => {
    const items = [item(0, 'a', 0.2), item(1, 'b', 0), item(2, 'a', 0.15), item(3, 'b', 0), item(4, 'a', 0.1)]
    expect(runs(items, keyOf, opts).map((r) => r.map((i) => i.time / beat))).toEqual([
      [0, 1, 2],
      [0.5, 1.5],
    ])
  })

  it('breaks where a beat is missing or the value jumps', () => {
    const items = [item(0, 'a', 0), item(2, 'a', 0.1), item(6, 'a', 0.2), item(8, 'a', -0.25), item(10, 'a', -0.3)]
    expect(runs(items, keyOf, opts).map((r) => r.map((i) => i.value))).toEqual([[0, 0.1], [0.2], [-0.25, -0.3]])
  })
})

const realDataPath = resolve(process.cwd(), 'public/data/lunar-events.json')

describe.runIf(existsSync(realDataPath))('on the whole catalog 1850-2149', () => {
  const all = moonEvents(decodeCatalog(JSON.parse(readFileSync(realDataPath, 'utf-8')) as RawCatalog).syzygies, {
    includeOrdinary: true,
  })
  const span = (all.at(-1)!.syzygy.time - all[0].syzygy.time) / 86_400_000
  const days = (times: number[]) => times.slice(1).map((t, i) => (t - times[i]) / 86_400_000)
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length

  it('finds one best alignment every half beat (~206 days), always a super- or micromoon', () => {
    const picks = bestAligned(all)
    expect(picks.length).toBeCloseTo((2 * span) / BEAT_DAYS, -1)
    const gaps = days(picks.map((p) => p.event.syzygy.time))
    expect(mean(gaps)).toBeCloseTo(BEAT_DAYS / 2, 0)
    expect(Math.min(...gaps)).toBeGreaterThan(150)
    expect(Math.max(...gaps)).toBeLessThan(260)
    expect(picks.every((p) => p.event.kind !== 'ordinary' && p.event.apsis === p.apsis)).toBe(true)
    expect(Math.max(...picks.map((p) => Math.abs(p.delta)))).toBeLessThan(1)
  })

  it('includes the best alignments of our time', () => {
    const times = bestAligned(all).map((p) => p.event.syzygy.time)
    expect(times).toContain(utc('2012-05-06T03:35:05'))
    expect(times).toContain(utc('2023-01-21T20:53:15'))
  })

  it('finds the closest supermoon and the farthest micromoon of every half beat', () => {
    for (const which of ['closest', 'farthest'] as const) {
      const picks = extremes(all, which)
      const gaps = days(picks.map((e) => e.syzygy.time))
      expect(mean(gaps)).toBeCloseTo(BEAT_DAYS / 2, 0)
      expect(Math.min(...gaps)).toBeGreaterThan(150)
      expect(picks.every((e) => e.kind === (which === 'closest' ? 'super' : 'micro'))).toBe(true)
    }
  })
})
