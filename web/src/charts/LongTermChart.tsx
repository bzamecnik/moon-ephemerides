import { useMemo, useState } from 'preact/hooks'
import type { MoonEvent } from '../events'
import { formatDate, type Zone } from '../format'
import { bestAligned, extremes } from '../longterm'
import { EventMark, Legend } from './marks'
import { linearScale, yearTicks } from './scale'

const YEAR_MS = 365.25 * 86_400_000
const SPANS = [
  { label: '20 years', years: 20 },
  { label: '60 years', years: 60 },
  { label: 'all (1850–2149)', years: 0 },
]
const W = 900
const M = { left: 76, right: 16 }
const GAP = 34
const AXIS = 30

interface Panel {
  title: string
  height: number
  domain: [number, number]
  ticks: number[]
  tick: (v: number) => string
}

const km = (v: number) => v.toLocaleString('en-US')
const PANELS: Panel[] = [
  {
    title: 'Δ (days)',
    height: 200,
    domain: [-0.4, 0.4],
    ticks: [-0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3],
    tick: (v) => (v > 0 ? `+${v.toFixed(1)}` : v < 0 ? `−${(-v).toFixed(1)}` : '0'),
  },
  { title: 'km', height: 120, domain: [356_250, 357_850], ticks: [356_500, 357_000, 357_500], tick: km },
  { title: 'km', height: 120, domain: [405_550, 406_800], ticks: [406_000, 406_500], tick: km },
]
const PANEL_TITLES = [
  'Best-aligned New or Full Moon of each half beat: time to its perigee or apogee',
  'Closest supermoons: distance',
  'Farthest micromoons: distance',
]

interface Props {
  /** all New and Full Moons, classified, sorted by time */
  events: MoonEvent[]
  anchor: number
  closestTime: number | undefined
  zone: Zone
  onSelect: (time: number) => void
}

export function LongTermChart({ events, anchor, closestTime, zone, onSelect }: Props) {
  const [years, setYears] = useState(60)
  const aligned = useMemo(() => bestAligned(events), [events])
  const closest = useMemo(() => extremes(events, 'closest'), [events])
  const farthest = useMemo(() => extremes(events, 'farthest'), [events])

  const [first, last] = [events[0]?.syzygy.time ?? 0, events.at(-1)?.syzygy.time ?? 0]
  const [t0, t1] = years === 0 ? [first, last] : [anchor - (years / 2) * YEAR_MS, anchor + (years / 2) * YEAR_MS]
  const inSpan = (t: number) => t >= t0 && t <= t1

  const x = linearScale([t0, t1], [M.left, W - M.right])
  let top = 22
  const layout = PANELS.map((p) => {
    const box = { top, bottom: top + p.height }
    top = box.bottom + GAP
    return { ...p, ...box, y: linearScale(p.domain, [box.bottom, box.top]) }
  })
  const H = layout.at(-1)!.bottom + AXIS
  const series: { time: number; value: number; event: MoonEvent }[][] = [
    aligned.map((a) => ({ time: a.event.syzygy.time, value: a.delta, event: a.event })),
    closest.map((e) => ({ time: e.syzygy.time, value: e.syzygy.distanceKm, event: e })),
    farthest.map((e) => ({ time: e.syzygy.time, value: e.syzygy.distanceKm, event: e })),
  ]
  const ticks = yearTicks(t0, t1, 10)
  const tickLabel = (t: number) =>
    formatDate(t, 'utc').endsWith('-01-01') ? formatDate(t, 'utc').slice(0, 4) : formatDate(t, 'utc').slice(0, 7)

  return (
    <figure class="chart">
      <div class="chart-controls">
        <label>
          Span{' '}
          <select value={years} onChange={(e) => setYears(Number(e.currentTarget.value))}>
            {SPANS.map((s) => (
              <option key={s.years} value={s.years}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <Legend ordinary={false} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="The best alignments and the extreme distances over the years">
        {layout.map((p, i) => (
          <g key={i} class="panel">
            <text class="tick panel-title" x={M.left} y={p.top - 8}>
              {PANEL_TITLES[i]}
            </text>
            {ticks.map((t) => (
              <line key={t} class="grid" x1={x(t)} x2={x(t)} y1={p.top} y2={p.bottom} />
            ))}
            {p.ticks.map((v) => (
              <g key={v} class={v === 0 && i === 0 ? 'reference' : 'grid'}>
                <line x1={M.left} x2={W - M.right} y1={p.y(v)} y2={p.y(v)} />
                <text class="tick" x={M.left - 6} y={p.y(v)} text-anchor="end" dominant-baseline="middle">
                  {p.tick(v)}
                </text>
              </g>
            ))}
            <line class="anchor-line" x1={x(anchor)} x2={x(anchor)} y1={p.top} y2={p.bottom} />
            {series[i]
              .filter((s) => inSpan(s.time))
              .map((s) => (
                <EventMark
                  key={s.time}
                  event={s.event}
                  x={x(s.time)}
                  y={p.y(s.value)}
                  zone={zone}
                  highlighted={s.time === closestTime}
                  onSelect={onSelect}
                />
              ))}
          </g>
        ))}
        {ticks.map((t) => (
          <text key={t} class="tick" x={x(t)} y={H - AXIS + 18} text-anchor="middle">
            {tickLabel(t)}
          </text>
        ))}
      </svg>
      <figcaption>
        Twice per beat (about every 206 days) the line through perigee and apogee points at the Sun, and the New and
        Full Moons line up with the distance cycle. <strong>Top:</strong> of each such stretch, the New or Full Moon
        nearest in time to its perigee or apogee, and how far from it (+ = the perigee or apogee comes later). New
        Moons and Full Moons each drift by about an hour per beat and jump back, so each gets a near-perfect alignment
        every 18–20 years (2012 for the Full Moon, 2023 for the New Moon). <strong>Middle and bottom:</strong> the
        closest supermoon and the farthest micromoon of each stretch. The closest ones come closer in northern winter,
        when the Earth is nearest the Sun and the Sun stretches the Moon's orbit most; the farthest ones change
        little. Click a mark to select it.
      </figcaption>
    </figure>
  )
}
