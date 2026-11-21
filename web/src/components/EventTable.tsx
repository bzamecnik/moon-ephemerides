import type { MoonEvent } from '../events'
import { apparentDiameterArcmin, eventLabel, notableKind } from '../events'
import { formatDateTime, formatDelta, formatDuration, formatRelative, formatZoned, localZoneName, type Zone } from '../format'

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
}

export function EventTable({ events, start, end, closest, nextIndex, anchor, zone }: Props) {
  const zoneName = zone === 'utc' ? 'UTC' : localZoneName()
  return (
    <div class="table-wrap">
      <table class="events">
        <caption class="visually-hidden">New and Full Moons near perigee and apogee, times in {zoneName}</caption>
        <thead>
          <tr>
            <th scope="col">When</th>
            <th scope="col">Date and time ({zoneName})</th>
            <th scope="col">Event</th>
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
            <th scope="col">Perigee / apogee</th>
            <th scope="col" class="num" title="Time of the perigee or apogee minus time of the New or Full Moon">
              Δ (days)
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
      <td colSpan={8}>▼ selected moment: {formatZoned(anchor, zone)}</td>
    </tr>
  )
}

function EventRow({
  event: e,
  anchor,
  zone,
  isClosest,
}: {
  event: MoonEvent
  anchor: number
  zone: Zone
  isClosest: boolean
}) {
  const kind = notableKind(e) ?? 'ordinary'
  const close = Math.abs(e.deltaDays) < CLOSE_ALIGNMENT_DAYS
  const classes = [e.syzygy.time < anchor ? 'past' : '', isClosest ? 'closest' : '', close ? 'close-alignment' : '']
  return (
    <tr
      class={classes.filter(Boolean).join(' ')}
      data-time={e.syzygy.time}
      aria-current={isClosest ? 'true' : undefined}
    >
      <td class="when">{formatRelative(e.syzygy.time, anchor)}</td>
      <td class="time">{formatDateTime(e.syzygy.time, zone)}</td>
      <td>
        <span class={`badge kind-${kind}`} data-testid="event">
          {eventLabel(e)}
        </span>
      </td>
      <td class="num">{e.syzygy.distanceKm.toLocaleString('en-US')}</td>
      <td class="num">{apparentDiameterArcmin(e.syzygy.distanceKm).toFixed(2)}</td>
      <td class="num">{e.closeness.toFixed(3)}</td>
      <td class="time">
        {e.apsis} {formatDateTime(e.apsisTime, zone)}
      </td>
      <td class="num delta" data-testid="delta" title={formatDuration(e.deltaDays)}>
        {formatDelta(e.deltaDays)}
        <span class="delta-human"> ({formatDuration(e.deltaDays)})</span>
      </td>
    </tr>
  )
}
