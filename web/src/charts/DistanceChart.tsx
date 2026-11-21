import { useMemo, useState } from 'preact/hooks'
import type { Apsis } from '../data/catalog'
import { sampleDistance } from '../distance'
import type { MoonEvent } from '../events'
import { formatDate, formatZoned, type Zone } from '../format'
import { firstIndexAtOrAfter } from '../timeline'
import { EventMark, Legend } from './marks'
import { linearScale, yearTicks } from './scale'

const DAY_MS = 86_400_000
const SPANS = [
  { label: '2 months', days: 61 },
  { label: '6 months', days: 183 },
  { label: '14 months (1 beat)', days: 427 },
  { label: '3 years', days: 1096 },
]
const [W, H] = [900, 380]
const M = { left: 76, right: 16, top: 16, bottom: 32 }
const KM_DOMAIN: [number, number] = [354_000, 408_000]

interface Props {
  events: MoonEvent[]
  apsides: Apsis[]
  anchor: number
  closestTime: number | undefined
  zone: Zone
  onSelect: (time: number) => void
}

const km = (d: number) => `${Math.round(d).toLocaleString('en-US')} km`

export function DistanceChart({ events, apsides, anchor, closestTime, zone, onSelect }: Props) {
  const [days, setDays] = useState(427)
  const [t0, t1] = [anchor - (days / 2) * DAY_MS, anchor + (days / 2) * DAY_MS]
  const step = days <= 61 ? DAY_MS / 12 : days <= 427 ? DAY_MS / 4 : DAY_MS / 2
  const curve = useMemo(() => sampleDistance(apsides, t0, t1, step), [apsides, t0, t1, step])

  // the apsides in the span plus one on each side, so that the envelopes reach the edges
  const apsisTimes = apsides.map((a) => a.time)
  const shownApsides = apsides.slice(
    Math.max(0, firstIndexAtOrAfter(apsisTimes, t0) - 2),
    firstIndexAtOrAfter(apsisTimes, t1 + 1) + 2,
  )
  const eventTimes = events.map((e) => e.syzygy.time)
  const shownEvents = events.slice(firstIndexAtOrAfter(eventTimes, t0), firstIndexAtOrAfter(eventTimes, t1 + 1))

  const x = linearScale([t0, t1], [M.left, W - M.right])
  const y = linearScale(KM_DOMAIN, [H - M.bottom, M.top])
  const line = (points: { time: number; km: number }[]) => points.map((p) => `${x(p.time)},${y(p.km)}`).join(' ')
  const envelope = (kind: Apsis['kind']) =>
    line(shownApsides.filter((a) => a.kind === kind).map((a) => ({ time: a.time, km: a.distanceKm })))

  return (
    <figure class="chart">
      <div class="chart-controls">
        <label>
          Span{' '}
          <select value={days} onChange={(e) => setDays(Number(e.currentTarget.value))}>
            {SPANS.map((s) => (
              <option key={s.days} value={s.days}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <Legend />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Distance of the Moon from Earth over time">
        <defs>
          <clipPath id="distance-plot">
            <rect x={M.left} y={M.top} width={W - M.left - M.right} height={H - M.top - M.bottom} />
          </clipPath>
        </defs>
        {[360_000, 370_000, 380_000, 390_000, 400_000].map((d) => (
          <g key={d} class="grid">
            <line x1={M.left} x2={W - M.right} y1={y(d)} y2={y(d)} />
            <text class="tick" x={M.left - 6} y={y(d)} text-anchor="end" dominant-baseline="middle">
              {d.toLocaleString('en-US')}
            </text>
          </g>
        ))}
        <text
          class="tick axis-title"
          transform={`translate(14 ${(M.top + H - M.bottom) / 2}) rotate(-90)`}
          text-anchor="middle"
        >
          distance (km)
        </text>
        {yearTicks(t0, t1, 10).map((t) => (
          <g key={t} class="grid">
            <line x1={x(t)} x2={x(t)} y1={M.top} y2={H - M.bottom} />
            <text class="tick" x={x(t)} y={H - M.bottom + 18} text-anchor="middle">
              {formatDate(t, 'utc').endsWith('-01-01')
                ? formatDate(t, 'utc').slice(0, 4)
                : formatDate(t, 'utc').slice(0, 7)}
            </text>
          </g>
        ))}
        <g clip-path="url(#distance-plot)">
          <polyline class="envelope" points={envelope('perigee')} />
          <polyline class="envelope" points={envelope('apogee')} />
          <polyline class="distance-curve" points={line(curve)} />
          {shownApsides.map((a) => (
            <line
              key={a.time}
              class="apsis-tick"
              x1={x(a.time)}
              x2={x(a.time)}
              y1={y(a.distanceKm) - 5}
              y2={y(a.distanceKm) + 5}
            >
              <title>
                {a.kind}, {formatZoned(a.time, zone)}, {km(a.distanceKm)}
              </title>
            </line>
          ))}
        </g>
        <line class="anchor-line" x1={x(anchor)} x2={x(anchor)} y1={M.top} y2={H - M.bottom}>
          <title>Selected moment: {formatZoned(anchor, zone)}</title>
        </line>
        {shownEvents.map((e) => (
          <EventMark
            key={e.syzygy.time}
            event={e}
            x={x(e.syzygy.time)}
            y={y(e.syzygy.distanceKm)}
            zone={zone}
            highlighted={e.syzygy.time === closestTime}
            onSelect={onSelect}
          />
        ))}
      </svg>
      <figcaption>
        The Moon's distance from Earth: closest at each perigee (bottom of the wave), farthest at each apogee (top),
        every 27.6 days. The dashed lines join the successive perigees and apogees: they swing in and out, most
        when the orbit lines up with the Sun. The marks are the New and Full Moons at their true distance; a
        supermoon is one near the bottom of a wave, a micromoon near the top. Between perigee and apogee the curve
        is approximated by half a cosine wave (typically within a few hundred km).
      </figcaption>
    </figure>
  )
}
