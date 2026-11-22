import { useMemo, useState } from 'preact/hooks'
import type { Apsis } from '../data/catalog'
import { smoothThrough, type CurvePoint } from '../curves'
import type { MoonEvent } from '../events'
import { formatDate, formatZoned, type Zone } from '../format'
import { moonPlace, moonTrack } from '../orbit'
import { firstIndexAtOrAfter } from '../timeline'
import { EventMark, Legend } from './marks'
import { linearScale, yearTicks } from './scale'
import { LearnMore } from '../components/LearnPage'
import { LEARN } from '../learn'

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
/** the panel below: the Moon's height above the plane of the Earth's orbit (ecliptic latitude) */
const H2 = 190
const LAT_DOMAIN: [number, number] = [-5.6, 5.6]
/** about how close to the plane (degrees) a New or Full Moon must be for some eclipse */
const ECLIPSE_LIMIT = 1.5

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
  const stepHours = days <= 61 ? 2 : days <= 427 ? 6 : 12
  const track = useMemo(() => moonTrack(t0, t1, stepHours), [t0, t1, stepHours])

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
  const y2 = linearScale(LAT_DOMAIN, [H2 - M.bottom, M.top])
  const line = (fy: (p: (typeof track)[number]) => number) => track.map((p) => `${x(p.time)},${fy(p)}`).join(' ')
  const latitudes = new Map(shownEvents.map((e) => [e.syzygy.time, moonPlace(e.syzygy.time).latitude]))
  const timeTicks = yearTicks(t0, t1, 10)
  const tickLabel = (t: number) =>
    formatDate(t, 'utc').endsWith('-01-01') ? formatDate(t, 'utc').slice(0, 4) : formatDate(t, 'utc').slice(0, 7)
  const smooth = (points: CurvePoint[]) =>
    smoothThrough(points, 8)
      .map((p) => `${x(p.time)},${y(p.value)}`)
      .join(' ')
  const envelope = (kind: Apsis['kind']) =>
    smooth(shownApsides.filter((a) => a.kind === kind).map((a) => ({ time: a.time, value: a.distanceKm })))
  // the New Moons and the Full Moons each lie on a slower wave (one beat long)
  const margin = 2 * 30 * DAY_MS
  const nearby = events.slice(
    firstIndexAtOrAfter(eventTimes, t0 - margin),
    firstIndexAtOrAfter(eventTimes, t1 + margin),
  )
  const phaseLine = (phase: 'new' | 'full') =>
    smooth(nearby.filter((e) => e.syzygy.phase === phase).map((e) => ({ time: e.syzygy.time, value: e.syzygy.distanceKm })))

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
        <ul class="legend line-legend" aria-label="Lines">
          {[
            ['phase-line phase-line-new', 'New Moons'],
            ['phase-line phase-line-full', 'Full Moons'],
            ['envelope', 'perigees, apogees'],
          ].map(([cls, label]) => (
            <li key={label}>
              <svg width="26" height="14" viewBox="0 0 26 14" aria-hidden="true">
                <line class={cls} x1="1" x2="25" y1="7" y2="7" />
              </svg>
              {label}
            </li>
          ))}
        </ul>
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
        {timeTicks.map((t) => (
          <g key={t} class="grid">
            <line x1={x(t)} x2={x(t)} y1={M.top} y2={H - M.bottom} />
            <text class="tick" x={x(t)} y={H - M.bottom + 18} text-anchor="middle">
              {tickLabel(t)}
            </text>
          </g>
        ))}
        <g clip-path="url(#distance-plot)">
          <polyline class="envelope" points={envelope('perigee')} />
          <polyline class="envelope" points={envelope('apogee')} />
          <polyline class="distance-curve" points={line((p) => y(p.distanceKm))} />
          <polyline class="phase-line phase-line-new" points={phaseLine('new')} />
          <polyline class="phase-line phase-line-full" points={phaseLine('full')} />
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
      <svg
        viewBox={`0 0 ${W} ${H2}`}
        role="img"
        aria-label="Height of the Moon above or below the plane of the Earth's orbit over time"
      >
        <defs>
          <clipPath id="latitude-plot">
            <rect x={M.left} y={M.top} width={W - M.left - M.right} height={H2 - M.top - M.bottom} />
          </clipPath>
        </defs>
        <rect
          class="eclipse-band"
          x={M.left}
          y={y2(ECLIPSE_LIMIT)}
          width={W - M.left - M.right}
          height={y2(-ECLIPSE_LIMIT) - y2(ECLIPSE_LIMIT)}
        >
          <title>New and Full Moons this close to the plane can be eclipses</title>
        </rect>
        {[-5, 0, 5].map((d) => (
          <g key={d} class={d === 0 ? 'reference' : 'grid'}>
            <line x1={M.left} x2={W - M.right} y1={y2(d)} y2={y2(d)} />
            <text class="tick" x={M.left - 6} y={y2(d)} text-anchor="end" dominant-baseline="middle">
              {d > 0 ? `${d}° N` : d < 0 ? `${-d}° S` : '0°'}
            </text>
          </g>
        ))}
        <text
          class="tick axis-title"
          transform={`translate(14 ${(M.top + H2 - M.bottom) / 2}) rotate(-90)`}
          text-anchor="middle"
        >
          height
        </text>
        {timeTicks.map((t) => (
          <g key={t} class="grid">
            <line x1={x(t)} x2={x(t)} y1={M.top} y2={H2 - M.bottom} />
            <text class="tick" x={x(t)} y={H2 - M.bottom + 18} text-anchor="middle">
              {tickLabel(t)}
            </text>
          </g>
        ))}
        <polyline
          class="distance-curve"
          clip-path="url(#latitude-plot)"
          points={line((p) => y2(p.latitude))}
        />
        <line class="anchor-line" x1={x(anchor)} x2={x(anchor)} y1={M.top} y2={H2 - M.bottom} />
        {shownEvents.map((e) => (
          <EventMark
            key={e.syzygy.time}
            event={e}
            x={x(e.syzygy.time)}
            y={y2(latitudes.get(e.syzygy.time) ?? 0)}
            zone={zone}
            highlighted={e.syzygy.time === closestTime}
            onSelect={onSelect}
          />
        ))}
      </svg>
      <figcaption>
        The Moon's distance from Earth: closest at each perigee (bottom of the wave), farthest at each apogee (top),
        every 27.6 days. The dotted lines join the successive perigees and apogees: they swing in and out, most
        when the orbit lines up with the Sun. The New Moons (solid line) and the Full Moons (dashed) each lie on a
        slower wave, one beat (~14 months) long; where the top or bottom of such a wave meets the bottom of the
        perigee line or the top of the apogee line, the two rhythms line up best. The marks are the New and Full Moons at their true distance; a
        supermoon is one near the bottom of a wave, a micromoon near the top. <strong>Below:</strong> how far the
        Moon is north or south of the plane of the Earth's orbit (the ecliptic). Its orbit is tilted by about 5°, so
        it crosses the plane twice a month, at the nodes. Only a New or Full Moon inside the shaded band, close to
        the plane, can be an eclipse (ringed marks); that happens in two seasons a year, when the node line points
        at the Sun. <LearnMore id={LEARN.eclipses}>More about eclipses.</LearnMore>
      </figcaption>
    </figure>
  )
}
