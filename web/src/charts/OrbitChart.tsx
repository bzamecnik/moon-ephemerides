import { useMemo } from 'preact/hooks'
import type { Apsis } from '../data/catalog'
import type { MoonEvent } from '../events'
import { formatZoned, type Zone } from '../format'
import { lineToSun, moonPlace, moonTrack, orbitFrame, phaseName, wrap360, type MoonPlace } from '../orbit'
import { firstIndexAtOrAfter } from '../timeline'
import { EventMark, Legend } from './marks'
import { LearnMore } from '../components/LearnPage'
import { LEARN } from '../learn'

const DAY_MS = 86_400_000
/** a little under a month, so that last month's New or Full Moon doesn't sit under the Moon */
const TRAIL_DAYS = 28
const TRAIL_STEP_HOURS = 3
const AGE_BANDS = 4

const S = 560
const C = S / 2
const MEAN_KM = 385_000
const R_MEAN = 165
/** the Moon's distance varies by ±7 %; drawn 4× more, or the orbit would look like a circle */
const EXAGGERATION = 4
const LINE_R = 225

interface Props {
  /** all New and Full Moons, classified, sorted by time */
  events: MoonEvent[]
  apsides: Apsis[]
  anchor: number
  closestTime: number | undefined
  zone: Zone
  onSelect: (time: number) => void
}

const radius = (km: number) => R_MEAN * (1 + (EXAGGERATION * (km - MEAN_KM)) / MEAN_KM)
/** a point at `deg` counter-clockwise from the Sun direction (to the right), seen from the north */
const polar = (deg: number, r: number): [number, number] => {
  const a = (deg * Math.PI) / 180
  return [C + r * Math.cos(a), C - r * Math.sin(a)]
}
const at = (p: MoonPlace) => polar(p.elongation, radius(p.distanceKm))
const pt = ([x, y]: [number, number]) => `${x.toFixed(1)},${y.toFixed(1)}`

/** Consecutive pieces of the trail of one kind (north/south of the ecliptic) and age. */
function trailPieces(track: MoonPlace[], now: number) {
  const pieces: { north: boolean; age: number; points: MoonPlace[] }[] = []
  for (let i = 0; i < track.length - 1; i++) {
    const [a, b] = [track[i], track[i + 1]]
    const north = a.latitude + b.latitude >= 0
    const age = Math.min(AGE_BANDS - 1, Math.floor(((now - a.time) / (TRAIL_DAYS * DAY_MS)) * AGE_BANDS))
    const last = pieces.at(-1)
    if (last && last.north === north && last.age === age) last.points.push(b)
    else pieces.push({ north, age, points: [a, b] })
  }
  return pieces
}

/** A body lit from the right (the Sun): dark disc, bright right half. */
function LitDisc({ x, y, r, cls }: { x: number; y: number; r: number; cls: string }) {
  return (
    <g class={cls}>
      <circle class="night" cx={x} cy={y} r={r} />
      <path class="day" d={`M ${x} ${y - r} A ${r} ${r} 0 0 1 ${x} ${y + r} Z`} />
      <circle class="outline" cx={x} cy={y} r={r} />
    </g>
  )
}

function LineEnds({ deg, labels, cls }: { deg: number; labels: [string, string]; cls: string }) {
  const [x1, y1] = polar(deg, LINE_R)
  const [x2, y2] = polar(deg + 180, LINE_R)
  const label = (d: number, text: string) => {
    const [x, y] = polar(d, LINE_R + 8)
    const c = Math.cos((d * Math.PI) / 180)
    const anchor = c > 0.3 ? 'start' : c < -0.3 ? 'end' : 'middle'
    const s = Math.sin((d * Math.PI) / 180)
    return (
      <text class="tick orbit-label" x={x} y={y - 6 * s} text-anchor={anchor} dominant-baseline="middle">
        {text}
      </text>
    )
  }
  return (
    <g class={cls}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      {label(deg, labels[0])}
      {label(deg + 180, labels[1])}
    </g>
  )
}

const deg = (d: number) => `${Math.round(d) % 360}°`

export function OrbitChart({ events, apsides, anchor, closestTime, zone, onSelect }: Props) {
  const t0 = anchor - TRAIL_DAYS * DAY_MS
  const track = useMemo(() => moonTrack(t0, anchor, TRAIL_STEP_HOURS), [t0, anchor])
  const now = track.at(-1)!
  const frame = orbitFrame(anchor)

  const eventTimes = events.map((e) => e.syzygy.time)
  const shownEvents = events
    .slice(firstIndexAtOrAfter(eventTimes, t0), firstIndexAtOrAfter(eventTimes, anchor + 1))
    .map((e) => ({ event: e, place: moonPlace(e.syzygy.time) }))
  const apsisTimes = apsides.map((a) => a.time)
  const shownApsides = apsides
    .slice(firstIndexAtOrAfter(apsisTimes, t0), firstIndexAtOrAfter(apsisTimes, anchor + 1))
    .map((a) => ({ apsis: a, place: moonPlace(a.time) }))

  const [mx, my] = at(now)
  const apseOff = lineToSun(frame.perigee)
  const nodeOff = lineToSun(frame.node)

  return (
    <figure class="chart orbit">
      <div class="chart-controls">
        <Legend />
      </div>
      <div class="orbit-layout">
        <svg
          class="orbit-chart"
          viewBox={`-40 0 ${S + 80} ${S}`}
          role="img"
          aria-label={`The Moon's orbit seen from above, the Sun to the right: ${phaseName(now.elongation)}`}
        >
          <defs>
            <marker id="sun-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 Z" class="sun-arrow-head" />
            </marker>
          </defs>
          {/* the phases at their fixed places in this frame */}
          {(
            [
              [0, 'New'],
              [90, 'first quarter'],
              [180, 'Full'],
              [270, 'last quarter'],
            ] as const
          ).map(([d, name]) => {
            const [x, y] = polar(d, 78)
            return (
              <text key={d} class="tick phase-name" x={x} y={d % 180 === 0 ? y - 12 : y} text-anchor="middle" dominant-baseline="middle">
                {name}
              </text>
            )
          })}
          <circle class="mean-orbit" cx={C} cy={C} r={R_MEAN} />
          <LineEnds deg={frame.node} labels={['☊ ascending', '☋ descending']} cls="node-line" />
          <LineEnds deg={frame.perigee} labels={['perigee', 'apogee']} cls="apse-line" />
          {trailPieces(track, anchor).map((p, i) => (
            <polyline
              key={i}
              class={`moon-trail ${p.north ? 'north' : 'south'}`}
              style={{ opacity: 1 - p.age / AGE_BANDS }}
              points={p.points.map((q) => pt(at(q))).join(' ')}
            />
          ))}
          {shownApsides.map(({ apsis, place }) => {
            const [x, y] = at(place)
            return (
              <path
                key={apsis.time}
                class={`apsis-${apsis.kind}`}
                transform={`translate(${x} ${y})`}
                d={apsis.kind === 'perigee' ? 'M -5 -3.5 L 5 -3.5 L 0 4.5 Z' : 'M -5 3.5 L 5 3.5 L 0 -4.5 Z'}
              >
                <title>
                  {apsis.kind}, {formatZoned(apsis.time, zone)}
                </title>
              </path>
            )
          })}
          {shownEvents.map(({ event, place }) => {
            const [x, y] = at(place)
            return (
              <EventMark
                key={event.syzygy.time}
                event={event}
                x={x}
                y={y}
                zone={zone}
                highlighted={event.syzygy.time === closestTime}
                onSelect={onSelect}
              />
            )
          })}
          <LitDisc x={C} y={C} r={11} cls="earth" />
          <LitDisc x={mx} y={my} r={7} cls="moon" />
          <g class="sun-pointer">
            <line x1={S - 30} y1={34} x2={S + 30} y2={34} marker-end="url(#sun-arrow)" />
            <text class="tick" x={S + 30} y={20} text-anchor="end">
              to the Sun
            </text>
          </g>
        </svg>
        <dl class="orbit-readout" aria-live="polite">
          <dt>Moment</dt>
          <dd>{formatZoned(anchor, zone)}</dd>
          <dt>Phase</dt>
          <dd>
            {phaseName(now.elongation)} ({deg(wrap360(now.elongation))} from the Sun)
          </dd>
          <dt>Distance</dt>
          <dd>{Math.round(now.distanceKm).toLocaleString('en-US')} km</dd>
          <dt>Height</dt>
          <dd>
            {Math.abs(now.latitude).toFixed(1)}° {now.latitude >= 0 ? 'north' : 'south'} of the Earth's orbit plane
          </dd>
          <dt>Perigee–apogee line</dt>
          <dd>
            {deg(apseOff)} from the Sun line
            <span class="readout-note">
              {apseOff < 20
                ? 'season of supermoons and micromoons: the orbit is stretched most'
                : apseOff > 70
                  ? 'across the Sun line: the orbit is roundest, no extreme New or Full Moons'
                  : 'turning, once per beat (411.8 days)'}
            </span>
          </dd>
          <dt>Node line</dt>
          <dd>
            {deg(nodeOff)} from the Sun line
            <span class="readout-note">
              {nodeOff < 17
                ? 'eclipse season: a New or Full Moon now can be an eclipse'
                : 'no eclipses now; the line turns once per eclipse year (346.6 days)'}
            </span>
          </dd>
        </dl>
      </div>
      <figcaption>
        The Earth, the Moon and the Sun seen from far above the Earth's north pole, the picture turning with the
        Sun so that the Sun always stays to the right. In this frame the phases stay put: New Moon towards the Sun,
        Full Moon away from it; the Moon goes round once a month (anticlockwise), its lit half always facing the
        Sun. The line is the Moon's path over the last four weeks, fading with age, solid where it is north of the plane
        of the Earth's orbit and dashed where south. Its oval is drawn four times more stretched than it is. The
        perigee–apogee line turns backwards once per beat: when it points at the Sun, New and Full Moons fall near
        perigee and apogee (supermoons, micromoons), and the Sun stretches the orbit most (evection). The dashed violet
        node line, where the orbit crosses the plane, turns once per eclipse year: when it points at the Sun, New
        and Full Moons happen near the plane and can be eclipses. Play by 6 hours or a day to watch a month, by a month or a beat to
        watch the lines turn.{' '}
        <LearnMore id={LEARN.frame}>More about this frame.</LearnMore>
      </figcaption>
    </figure>
  )
}
