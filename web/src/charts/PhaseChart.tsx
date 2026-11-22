import { useMemo, useState } from 'preact/hooks'
import type { MoonEvent } from '../events'
import { formatZoned, type Zone } from '../format'
import { phaseAt, samplePhases, splitAtWraps, type PhaseMarks, type PhasePoint } from '../phase'
import { firstIndexAtOrAfter } from '../timeline'
import { EventMark, Legend } from './marks'
import { linearScale } from './scale'
import { LearnMore } from '../components/LearnPage'
import { LEARN } from '../learn'

const DAY_MS = 86_400_000
const SPANS = [
  { label: '1 month', days: 30 },
  { label: '1 beat (412 days)', days: 412 },
  { label: '3 beats', days: 3 * 412 },
]
const SIZE = 440
const M = { left: 72, right: 16, top: 16, bottom: 40 }

interface Props {
  events: MoonEvent[]
  synodic: PhaseMarks
  anomalistic: PhaseMarks
  anchor: number
  closestTime: number | undefined
  zone: Zone
  onSelect: (time: number) => void
}

const wrapped = (a: PhasePoint, b: PhasePoint) =>
  Math.abs(b.synodic - a.synodic) > 0.5 || Math.abs(b.anomalistic - a.anomalistic) > 0.5

export function PhaseChart({ events, synodic, anomalistic, anchor, closestTime, zone, onSelect }: Props) {
  const [days, setDays] = useState(412)
  const [t0, t1] = [anchor - (days / 2) * DAY_MS, anchor + (days / 2) * DAY_MS]
  const step = days <= 30 ? DAY_MS / 8 : DAY_MS / 2
  const samples = useMemo(() => samplePhases(synodic, anomalistic, t0, t1, step), [synodic, anomalistic, t0, t1, step])
  const past = splitAtWraps(
    samples.filter((p) => p.time <= anchor),
    wrapped,
  )
  const future = splitAtWraps(
    samples.filter((p) => p.time >= anchor),
    wrapped,
  )
  const times = events.map((e) => e.syzygy.time)
  const inSpan = events.slice(firstIndexAtOrAfter(times, t0), firstIndexAtOrAfter(times, t1 + 1))

  const [W, H] = [SIZE + M.left + M.right, SIZE + M.top + M.bottom]
  const x = linearScale([0, 1], [M.left, M.left + SIZE])
  const y = linearScale([0, 1], [M.top + SIZE, M.top])
  const path = (run: PhasePoint[]) => run.map((p) => `${x(p.synodic)},${y(p.anomalistic)}`).join(' ')
  const now = { s: phaseAt(synodic, anchor), a: phaseAt(anomalistic, anchor) }

  const xTicks = [
    [0, 'New'],
    [0.25, 'First quarter'],
    [0.5, 'Full'],
    [0.75, 'Last quarter'],
    [1, 'New'],
  ] as const
  const yTicks = [
    [0, 'perigee'],
    [0.5, 'apogee'],
    [1, 'perigee'],
  ] as const

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
      <svg
        class="phase-chart"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="The Moon's phase against its position between perigee and apogee"
      >
        {xTicks.map(([v, label]) => (
          <g key={v} class={v === 0.5 ? 'reference' : 'grid'}>
            <line x1={x(v)} x2={x(v)} y1={y(0)} y2={y(1)} />
            <text class="tick" x={x(v)} y={y(0) + 18} text-anchor="middle">
              {label}
            </text>
          </g>
        ))}
        {yTicks.map(([v, label]) => (
          <g key={v} class={v === 0.5 ? 'reference' : 'grid'}>
            <line x1={x(0)} x2={x(1)} y1={y(v)} y2={y(v)} />
            <text class="tick" x={x(0) - 14} y={y(v)} text-anchor="end" dominant-baseline="middle">
              {label}
            </text>
          </g>
        ))}
        {past.map((run, i) => (
          <polyline key={`p${i}`} class="phase-path past" points={path(run)} />
        ))}
        {future.map((run, i) => (
          <polyline key={`f${i}`} class="phase-path" points={path(run)} />
        ))}
        {inSpan.map((e) => {
          const a = phaseAt(anomalistic, e.syzygy.time)
          if (a === null) return null
          return (
            <EventMark
              key={e.syzygy.time}
              event={e}
              x={x(e.syzygy.phase === 'new' ? 0 : 0.5)}
              y={y(a)}
              zone={zone}
              highlighted={e.syzygy.time === closestTime}
              onSelect={onSelect}
            />
          )
        })}
        {now.s !== null && now.a !== null && (
          <circle class="anchor-dot" cx={x(now.s)} cy={y(now.a)} r={7}>
            <title>Selected moment: {formatZoned(anchor, zone)}</title>
          </circle>
        )}
      </svg>
      <figcaption>
        Across: the Moon's phase (New → Full → New). Up: where it is between perigee (closest) and apogee
        (farthest). Day by day the Moon draws a diagonal line; the distance cycle is 2 days shorter, so the line runs
        a little steeper than 45° and its crossings of the New and Full Moon columns creep up month by month, round
        the whole square in ~412 days. Marks near the perigee lines (bottom, top) are supermoons, near the apogee
        line (middle) micromoons. The dot is the selected moment, the lighter line its past. Positions between
        events are interpolated linearly in time, so they are approximate.{' '}
        <LearnMore id={LEARN.phasePicture}>More about this picture.</LearnMore>
      </figcaption>
    </figure>
  )
}
