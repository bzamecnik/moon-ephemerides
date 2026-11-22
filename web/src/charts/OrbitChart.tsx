import { useMemo } from 'preact/hooks'
import type { Apsis } from '../data/catalog'
import type { MoonEvent } from '../events'
import { formatZoned, type Zone } from '../format'
import {
  ECLIPSE_LATITUDE,
  ECLIPSE_NODE_DISTANCE,
  ECLIPSE_SEASON_ANGLE,
  apsisDirection,
  lineToSun,
  moonPlace,
  moonTrack,
  orbitFrame,
  phaseName,
  planeCrossings,
  trailWindow,
  wrap360,
  type MoonPlace,
} from '../orbit'
import { firstIndexAtOrAfter } from '../timeline'
import { EventMark, Legend, NodeMark, nodeSymbol } from './marks'
import { LearnMore } from '../components/LearnPage'
import { LEARN } from '../learn'

const TRAIL_STEP_HOURS = 3
/** the oldest part of the path fades to this opacity */
const OLDEST_OPACITY = 0.15

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

function LineEnds({
  deg,
  degB = deg + 180,
  labels,
  cls,
}: {
  deg: number
  /** the direction of the other end, if not opposite */
  degB?: number
  labels: [string, string]
  cls: string
}) {
  const [x1, y1] = polar(deg, LINE_R)
  const [x2, y2] = polar(degB, LINE_R)
  // the two halves separately, so that they can be styled (perigee warm, apogee cool)
  const label = (d: number, text: string, end: string) => {
    const [x, y] = polar(d, LINE_R + 8)
    const c = Math.cos((d * Math.PI) / 180)
    const anchor = c > 0.3 ? 'start' : c < -0.3 ? 'end' : 'middle'
    const s = Math.sin((d * Math.PI) / 180)
    return (
      <text class={`tick orbit-label ${end}`} x={x} y={y - 6 * s} text-anchor={anchor} dominant-baseline="middle">
        {text}
      </text>
    )
  }
  return (
    <g class={cls}>
      <line class="end-a" x1={C} y1={C} x2={x1} y2={y1} />
      <line class="end-b" x1={C} y1={C} x2={x2} y2={y2} />
      {label(deg, labels[0], 'end-a')}
      {label(degB, labels[1], 'end-b')}
    </g>
  )
}

/** An annular sector of the orbit's ring, ±half degrees around `center`, from the closest to the farthest Moon. */
function ringSector(center: number, half: number) {
  const [r0, r1] = [radius(354_000), radius(408_000)]
  const [a, b] = [center - half, center + half]
  const p = (d: number, r: number) => pt(polar(d, r))
  // anticlockwise on screen is a negative sweep (y points down)
  return `M ${p(a, r1)} A ${r1} ${r1} 0 0 0 ${p(b, r1)} L ${p(b, r0)} A ${r0} ${r0} 0 0 1 ${p(a, r0)} Z`
}

const deg = (d: number) => `${Math.round(d) % 360}°`

export function OrbitChart({ events, apsides, anchor, closestTime, zone, onSelect }: Props) {
  const eventTimes = useMemo(() => events.map((e) => e.syzygy.time), [events])
  const { t0, t1 } = trailWindow(anchor)
  const past = useMemo(() => moonTrack(t0, anchor, TRAIL_STEP_HOURS), [t0, anchor])
  const coming = useMemo(() => (t1 > anchor ? moonTrack(anchor, t1, TRAIL_STEP_HOURS) : []), [anchor, t1])
  const now = past.at(-1)!
  const frame = orbitFrame(anchor)
  const crossings = planeCrossings([...past, ...coming.slice(1)])

  const shownEvents = events
    .slice(firstIndexAtOrAfter(eventTimes, t0), firstIndexAtOrAfter(eventTimes, t1 + 1))
    .map((e) => ({ event: e, place: moonPlace(e.syzygy.time) }))
  const apsisTimes = apsides.map((a) => a.time)
  const shownApsides = apsides
    .slice(firstIndexAtOrAfter(apsisTimes, t0), firstIndexAtOrAfter(apsisTimes, t1 + 1))
    .map((a) => ({ apsis: a, place: moonPlace(a.time) }))

  const [mx, my] = at(now)
  // the true perigee and apogee directions, between the ones before and after the moment
  const around = (kind: Apsis['kind']) => {
    const ofKind = apsides.filter((a) => a.kind === kind)
    const i = firstIndexAtOrAfter(
      ofKind.map((a) => a.time),
      anchor,
    )
    return ofKind.slice(Math.max(0, i - 1), i + 1).map((a) => ({ time: a.time, elongation: moonPlace(a.time).elongation }))
  }
  const perigeeDir = apsisDirection(around('perigee'), anchor) ?? frame.perigee
  const apogeeDir = apsisDirection(around('apogee'), anchor) ?? frame.perigee + 180
  const apseOff = lineToSun(perigeeDir)
  const nodeOff = lineToSun(frame.node)

  return (
    <figure class="chart orbit">
      <div class="chart-controls">
        <Legend />
        <ul class="legend line-legend" aria-label="Lines">
          {[
            ['moon-trail', 'the Moon: last two weeks'],
            ['moon-coming', 'next two weeks'],
            ['sun-line', 'towards the Sun'],
          ].map(([cls, label]) => (
            <li key={label}>
              <svg width="26" height="14" viewBox="0 0 26 14" aria-hidden="true">
                <line class={cls} x1="1" x2="25" y1="7" y2="7" />
              </svg>
              {label}
            </li>
          ))}
          <li>
            <svg width="26" height="14" viewBox="0 0 26 14" aria-hidden="true">
              <g class="apse-line">
                <line class="end-a" x1="1" x2="13" y1="7" y2="7" />
                <line class="end-b" x1="13" x2="25" y1="7" y2="7" />
              </g>
            </svg>
            <span>
              <span class="apsis-symbol perigee">▼</span> perigee – <span class="apsis-symbol apogee">▲</span> apogee
              line, and where the Moon passes them
            </span>
          </li>
          <li>
            <svg width="26" height="14" viewBox="0 0 26 14" aria-hidden="true">
              <line class="node-line-legend" x1="1" x2="25" y1="7" y2="7" />
            </svg>
            <span>
              <span class="node-symbol">☊</span> ascending – <span class="node-symbol">☋</span> descending node line,
              and where the Moon crosses the Earth's orbit plane
            </span>
          </li>
          <li>
            <svg width="26" height="14" viewBox="0 0 26 14" aria-hidden="true">
              <rect class="eclipse-zone" x="1" y="2" width="24" height="10" />
            </svg>
            close enough to the plane for an eclipse
          </li>
        </ul>
      </div>
      <div class="orbit-layout">
        <svg
          class="orbit-chart"
          viewBox={`-40 0 ${S + 80} ${S}`}
          role="img"
          aria-label={`The Moon's orbit seen from above, the Sun to the right: ${phaseName(now.elongation)}`}
        >
          <defs>
            <marker id="sun-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 Z" class="sun-arrow-head" />
            </marker>
          </defs>
          {/* the direction of the Sun, through the Earth, to compare the other lines with */}
          <line class="sun-line" x1={C - LINE_R} y1={C} x2={S + 26} y2={C} marker-end="url(#sun-arrow)" />
          <text class="tick sun-label" x={S + 30} y={C - 12} text-anchor="end">
            ☉ to the Sun
          </text>
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
          <LineEnds deg={perigeeDir} degB={apogeeDir} labels={['▼ perigee', '▲ apogee']} cls="apse-line" />
          {/* around the nodes the Moon is close enough to the plane for an eclipse; turns with the node line */}
          {[frame.node, frame.node + 180].map((d) => (
            <path key={d} class="eclipse-zone" d={ringSector(d, ECLIPSE_NODE_DISTANCE)} />
          ))}
          {/* the past fades with age; the coming days dashed */}
          {past.slice(1).map((q, i) => (
            <line
              key={q.time}
              class="moon-trail"
              style={{ opacity: OLDEST_OPACITY + ((1 - OLDEST_OPACITY) * (q.time - t0)) / (anchor - t0) }}
              x1={at(past[i])[0]}
              y1={at(past[i])[1]}
              x2={at(q)[0]}
              y2={at(q)[1]}
            />
          ))}
          {coming.length > 1 && <polyline class="moon-coming" points={coming.map((q) => pt(at(q))).join(' ')} />}
          {crossings.map((c) => {
            const [x, y] = at({ ...c, latitude: 0 })
            // the symbol just outside the path
            const [sx, sy] = polar(c.elongation, radius(c.distanceKm) + 13)
            return (
              <NodeMark
                key={c.time}
                x={x}
                y={y}
                dx={sx - x}
                dy={sy - y}
                ascending={c.ascending}
                title={`${nodeSymbol(c.ascending)} crosses the plane of the Earth's orbit going ${c.ascending ? 'north' : 'south'}, ${formatZoned(c.time, zone)}`}
              />
            )
          })}
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
          <circle class="moment-ring" cx={mx} cy={my} r={11}>
            <title>The Moon at the selected moment, {formatZoned(anchor, zone)}</title>
          </circle>
          <LitDisc x={mx} y={my} r={7} cls="moon" />
        </svg>
        <dl class="orbit-readout" aria-live="polite">
          <div class="readout-group">
            <dt>Time</dt>
            <dd>{formatZoned(anchor, zone)}</dd>
            <dt>Phase</dt>
            <dd>
              {phaseName(now.elongation)}
              <span class="readout-note">{deg(wrap360(now.elongation))} from the Sun</span>
            </dd>
          </div>
          <div class="readout-group">
            <dt>Distance</dt>
            <dd>{Math.round(now.distanceKm).toLocaleString('en-US')} km</dd>
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
          </div>
          <div class="readout-group">
            <dt>Height</dt>
            <dd>
              {Math.abs(now.latitude).toFixed(1)}° {now.latitude >= 0 ? 'north' : 'south'} of the Earth's orbit plane
              {Math.abs(now.latitude) < ECLIPSE_LATITUDE && (
                <span class="readout-note">close enough to the plane for an eclipse</span>
              )}
            </dd>
            <dt>Node line</dt>
            <dd>
              {deg(nodeOff)} from the Sun line
              <span class="readout-note">
                {nodeOff < ECLIPSE_SEASON_ANGLE
                  ? 'eclipse season: a New or Full Moon now can be an eclipse'
                  : 'no eclipses now; the line turns once per eclipse year (346.6 days)'}
              </span>
            </dd>
          </div>
        </dl>
      </div>
      <figcaption>
        The Earth, the Moon and the Sun seen from far above the Earth's north pole, the picture turning with the
        Sun so that the Sun always stays to the right. In this frame the phases stay put: New Moon towards the Sun,
        Full Moon away from it; the Moon goes round once a month (anticlockwise), its lit half always facing the
        Sun. The Moon (ringed in yellow, at the selected moment) leaves a path fading with age; the dashed line is
        where it goes in the next two weeks, past the next New or Full Moon. The triangles mark where it passes the perigee (▼)
        and the apogee (▲), the violet dots where it crosses the plane of the Earth's orbit going north (☊) or
        south (☋), within the shaded zones around the node line the Moon is close enough to the plane for a New or Full Moon to be an eclipse: the perigee–apogee line goes through each perigee and apogee as the Moon gets there, turning evenly in
        between. The oval is drawn four times more stretched than it is. The
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
