import { useMemo, useState } from 'preact/hooks'
import { beatLines, beatPoints, HALF_ANOMALISTIC_DAYS } from '../beat'
import type { MoonEvent } from '../events'
import { formatDate, formatZoned, type Zone } from '../format'
import { EventMark, Legend } from './marks'
import { linearScale, yearTicks } from './scale'

const YEAR_MS = 365.25 * 86_400_000
const SPANS = [
  { label: '2 years', years: 2 },
  { label: '6 years', years: 6 },
  { label: '20 years', years: 20 },
]
const [W, H] = [900, 380]
const M = { left: 64, right: 64, top: 16, bottom: 32 }

interface Props {
  /** all New and Full Moons, classified, sorted by time */
  events: MoonEvent[]
  anchor: number
  /** time of the event closest to the selected moment */
  closestTime: number | undefined
  zone: Zone
  onSelect: (time: number) => void
}

export function BeatChart({ events, anchor, closestTime, zone, onSelect }: Props) {
  const [years, setYears] = useState(6)
  const [t0, t1] = [anchor - (years / 2) * YEAR_MS, anchor + (years / 2) * YEAR_MS]
  const points = useMemo(() => beatPoints(events, t0, t1), [events, t0, t1])
  const lines = useMemo(() => beatLines(points), [points])

  const x = linearScale([t0, t1], [M.left, W - M.right])
  const y = linearScale([-15, 15], [H - M.bottom, M.top])
  const ticks = yearTicks(t0, t1, 10)
  const refs = [
    { d: 0, label: 'perigee' },
    { d: HALF_ANOMALISTIC_DAYS, label: 'apogee' },
    { d: -HALF_ANOMALISTIC_DAYS, label: 'apogee' },
  ]

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
        <Legend />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Time from each New and Full Moon to the nearest perigee">
        {[-10, -5, 5, 10].map((d) => (
          <g key={d} class="grid">
            <line x1={M.left} x2={W - M.right} y1={y(d)} y2={y(d)} />
            <text class="tick" x={M.left - 6} y={y(d)} text-anchor="end" dominant-baseline="middle">
              {d > 0 ? `+${d}` : `−${-d}`}
            </text>
          </g>
        ))}
        {refs.map(({ d, label }) => (
          <g key={d} class="reference">
            <line x1={M.left} x2={W - M.right} y1={y(d)} y2={y(d)} />
            <text class="tick" x={W - M.right + 6} y={y(d)} dominant-baseline="middle">
              {label}
            </text>
          </g>
        ))}
        <text class="tick" x={M.left - 6} y={y(0)} text-anchor="end" dominant-baseline="middle">
          0
        </text>
        <text
          class="tick axis-title"
          transform={`translate(14 ${(M.top + H - M.bottom) / 2}) rotate(-90)`}
          text-anchor="middle"
        >
          days to the nearest perigee
        </text>
        {ticks.map((t) => (
          <g key={t} class="grid">
            <line x1={x(t)} x2={x(t)} y1={M.top} y2={H - M.bottom} />
            <text class="tick" x={x(t)} y={H - M.bottom + 18} text-anchor="middle">
              {formatDate(t, 'utc').endsWith('-01-01') ? formatDate(t, 'utc').slice(0, 4) : formatDate(t, 'utc').slice(0, 7)}
            </text>
          </g>
        ))}
        {lines.map((line, i) => (
          <polyline
            key={i}
            class={`beat-line beat-line-${line[0].event.syzygy.phase}`}
            points={line.map((p) => `${x(p.time)},${y(p.delta)}`).join(' ')}
          />
        ))}
        <line class="anchor-line" x1={x(anchor)} x2={x(anchor)} y1={M.top} y2={H - M.bottom}>
          <title>Selected moment: {formatZoned(anchor, zone)}</title>
        </line>
        {points.map((p) => (
          <EventMark
            key={p.time}
            event={p.event}
            x={x(p.time)}
            y={y(p.delta)}
            zone={zone}
            highlighted={p.time === closestTime}
            onSelect={onSelect}
          />
        ))}
      </svg>
      <figcaption>
        Each mark is a New or Full Moon; its height is the time to the nearest perigee (days, + = perigee comes
        later). Supermoons sit on the perigee line, micromoons near the apogee lines half an orbit (13.8 days) away.
        The solid lines join consecutive New Moons, the dashed ones Full Moons: on average they drift by 2 days a
        month (29.5 − 27.6), which makes the ~412-day beat; near the perigee line more slowly, because the
        distance cycle is longest when it is lined up with the Sun. Where a line crosses zero, the two rhythms line up. Click a mark to select it.
      </figcaption>
    </figure>
  )
}
