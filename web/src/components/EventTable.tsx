import type { MoonEvent } from '../events'
import { apparentDiameterArcmin, eventLabel } from '../events'
import { formatRelative, formatZoned, localZoneName, type Zone } from '../format'
import { ApsisCell, DeltaCells, EclipseCell, KindCell, PhaseCell, TimeButton } from './cells'

/** Δ below this (days) counts as a close alignment of the two rhythms */
export const CLOSE_ALIGNMENT_DAYS = 0.25

interface Props {
  events: MoonEvent[]
  /** the rows shown: events[start..end) */
  start: number
  end: number
  /** index of the event closest to the selected moment */
  closest: number
  /** index of the first event at or after the selected moment (the line goes before it) */
  nextIndex: number
  anchor: number
  zone: Zone
  /** select a moment (clicking a date) */
  onSelect?: (time: number) => void
}

const COLUMNS = 12

export function EventTable({ events, start, end, closest, nextIndex, anchor, zone, onSelect }: Props) {
  const zoneName = zone === 'utc' ? 'UTC' : localZoneName()
  return (
    <div class="table-wrap">
      <table class="events">
        <caption class="visually-hidden">New and Full Moons near perigee and apogee, times in {zoneName}</caption>
        <thead>
          <tr>
            <th scope="col">When</th>
            <th scope="col">Date and time ({zoneName})</th>
            <th scope="col">Phase</th>
            <th scope="col">Kind</th>
            <th scope="col" title="Solar eclipse at New Moon, lunar eclipse at Full Moon">
              Eclipse
            </th>
            <th scope="col" class="num" title="Distance between the centres of the Earth and the Moon">
              Distance (km)
            </th>
            <th scope="col" class="num" title="Apparent diameter of the Moon in minutes of arc">
              Size (′)
            </th>
            <th
              scope="col"
              class="num"
              title="How close the Moon is to the perigee or apogee distance: 1 = exactly at it (Espenak's relative distance)"
            >
              Closeness
            </th>
            <th scope="col">Nearest</th>
            <th scope="col">Its date and time</th>
            <th scope="col" class="num" title="Time of the perigee or apogee minus time of the New or Full Moon">
              Δ (days)
            </th>
            <th scope="col">
              <span class="visually-hidden">Δ in hours or minutes</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {events.slice(start, end).map((e, i) => {
            const index = start + i
            return [
              index === nextIndex && <AnchorRow key="anchor" anchor={anchor} zone={zone} />,
              <EventRow
                key={e.syzygy.time}
                event={e}
                anchor={anchor}
                zone={zone}
                isClosest={index === closest}
                onSelect={onSelect}
              />,
            ]
          })}
          {nextIndex >= end && <AnchorRow anchor={anchor} zone={zone} />}
        </tbody>
      </table>
    </div>
  )
}

function AnchorRow({ anchor, zone }: { anchor: number; zone: Zone }) {
  return (
    <tr class="anchor-row">
      <td colSpan={COLUMNS}>▼ selected moment: {formatZoned(anchor, zone)}</td>
    </tr>
  )
}

function EventRow({
  event: e,
  anchor,
  zone,
  isClosest,
  onSelect,
}: {
  event: MoonEvent
  anchor: number
  zone: Zone
  isClosest: boolean
  onSelect?: (time: number) => void
}) {
  const close = Math.abs(e.deltaDays) < CLOSE_ALIGNMENT_DAYS
  const classes = [e.syzygy.time < anchor ? 'past' : '', isClosest ? 'closest' : '', close ? 'close-alignment' : '']
  return (
    <tr
      class={classes.filter(Boolean).join(' ')}
      data-time={e.syzygy.time}
      aria-current={isClosest ? 'true' : undefined}
    >
      <td class="when">{formatRelative(e.syzygy.time, anchor)}</td>
      <td class="time">
        <TimeButton time={e.syzygy.time} zone={zone} onSelect={onSelect} label={eventLabel(e)} />
      </td>
      <PhaseCell event={e} />
      <KindCell event={e} />
      <EclipseCell event={e} />
      <td class="num">{e.syzygy.distanceKm.toLocaleString('en-US')}</td>
      <td class="num">{apparentDiameterArcmin(e.syzygy.distanceKm).toFixed(2)}</td>
      <td class="num">{e.closeness.toFixed(3)}</td>
      <ApsisCell event={e} />
      <td class="time">
        <TimeButton time={e.apsisTime} zone={zone} onSelect={onSelect} label={`the ${e.apsis}`} />
      </td>
      <DeltaCells event={e} />
    </tr>
  )
}
