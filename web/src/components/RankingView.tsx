import { useState } from 'preact/hooks'
import { eventLabel, type MoonEvent } from '../events'
import type { Zone } from '../format'
import { DeltaCells, EclipseCell, KindCell, PhaseCell, TimeButton } from './cells'
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
              <th scope="col">Phase</th>
              <th scope="col">Kind</th>
              <th scope="col">Eclipse</th>
              <th scope="col" class="num">
                Δ (days)
              </th>
              <th scope="col">
                <span class="visually-hidden">Δ in hours or minutes</span>
              </th>
              <th scope="col" class="num">
                Distance (km)
              </th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((e, i) => (
              <tr key={e.syzygy.time} data-time={e.syzygy.time}>
                <td class="num">{i + 1}</td>
                <td class="time">
                  <TimeButton time={e.syzygy.time} zone={zone} onSelect={onSelect} label={`${eventLabel(e)} in the table`} />
                </td>
                <PhaseCell event={e} />
                <KindCell event={e} />
                <EclipseCell event={e} />
                <DeltaCells event={e} />
                <td class="num">{e.syzygy.distanceKm.toLocaleString('en-US')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
