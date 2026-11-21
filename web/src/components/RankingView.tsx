import { useState } from 'preact/hooks'
import { eventLabel, notableKind, type MoonEvent } from '../events'
import { formatDateTime, formatDelta, formatDuration, type Zone } from '../format'
import { bestAlignments, ERAS } from '../ranking'

const LIMIT = 25

interface Props {
  /** events of the chosen kinds */
  events: MoonEvent[]
  zone: Zone
  onSelect: (time: number) => void
}

export function RankingView({ events, zone, onSelect }: Props) {
  const [era, setEra] = useState(2)
  const ranked = bestAlignments(events, ERAS[era], LIMIT)
  return (
    <section class="ranking">
      <div class="chart-controls">
        <label>
          Years{' '}
          <select value={era} onChange={(e) => setEra(Number(e.currentTarget.value))}>
            {ERAS.map((e, i) => (
              <option key={e.label} value={i}>
                {e.label}
              </option>
            ))}
          </select>
        </label>
        <p class="hint">
          The {LIMIT} super- and micromoons (of the kinds chosen above) closest in time to their perigee or apogee.
        </p>
      </div>
      <div class="table-wrap">
        <table class="events">
          <thead>
            <tr>
              <th scope="col" class="num">
                #
              </th>
              <th scope="col">Date and time ({zone === 'utc' ? 'UTC' : 'local'})</th>
              <th scope="col">Event</th>
              <th scope="col" class="num">
                Δ (days)
              </th>
              <th scope="col" class="num">
                Distance (km)
              </th>
              <th scope="col">
                <span class="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((e, i) => (
              <tr key={e.syzygy.time} data-time={e.syzygy.time}>
                <td class="num">{i + 1}</td>
                <td class="time">{formatDateTime(e.syzygy.time, zone)}</td>
                <td>
                  <span class={`badge kind-${notableKind(e)}`} data-testid="event">
                    {eventLabel(e)}
                  </span>
                </td>
                <td class="num delta">
                  {formatDelta(e.deltaDays)}
                  <span class="delta-human"> ({formatDuration(e.deltaDays)})</span>
                </td>
                <td class="num">{e.syzygy.distanceKm.toLocaleString('en-US')}</td>
                <td class="actions">
                  <button type="button" onClick={() => onSelect(e.syzygy.time)}>
                    Show
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
