import { useMemo, useState } from 'preact/hooks'
import type { Catalog } from '../data/catalog'
import {
  apparentDiameterArcmin,
  eventLabel,
  moonEvents,
  NOTABLE_KINDS,
  notableKind,
  type MoonEvent,
  type NotableKind,
} from '../events'
import {
  formatDate,
  formatDateTime,
  formatDelta,
  formatDuration,
  formatRelative,
  parseDate,
  type Zone,
} from '../format'
import { firstIndexAtOrAfter, stepAnchor, windowAround } from '../timeline'

const ROWS_BEFORE = 6
const ROWS_AFTER = 14
const PAGE = 10
/** Δ below this (days) counts as a close alignment of the two rhythms */
export const CLOSE_ALIGNMENT_DAYS = 0.25

const KIND_LABELS: Record<NotableKind, string> = {
  'new-super': 'New Supermoon',
  'full-super': 'Full Supermoon',
  'new-micro': 'New Micromoon',
  'full-micro': 'Full Micromoon',
}

interface Props {
  catalog: Catalog
  initialAnchor: number
  /** the current time, for the "Now" button */
  now: number
  /** called when the user picks a moment (to keep it in the URL) */
  onAnchorChange?: (anchor: number) => void
}

export function EventsView({ catalog, initialAnchor, now, onAnchorChange }: Props) {
  const [anchor, setAnchorState] = useState(initialAnchor)
  const [zone, setZone] = useState<Zone>('utc')
  const [kinds, setKinds] = useState<ReadonlySet<NotableKind>>(new Set(NOTABLE_KINDS))
  const [includeOrdinary, setIncludeOrdinary] = useState(false)

  const events = useMemo(
    () => moonEvents(catalog.syzygies, { kinds, includeOrdinary }),
    [catalog, kinds, includeOrdinary],
  )
  const times = useMemo(() => events.map((e) => e.syzygy.time), [events])
  const nextIndex = firstIndexAtOrAfter(times, anchor)
  const { start, end } = windowAround(events.length, nextIndex, ROWS_BEFORE, ROWS_AFTER)
  const next: MoonEvent | undefined = events[nextIndex]

  const setAnchor = (a: number) => {
    setAnchorState(a)
    onAnchorChange?.(a)
  }
  const step = (n: number) => setAnchor(stepAnchor(times, anchor, n))
  const toggleKind = (k: NotableKind) => {
    const s = new Set(kinds)
    if (s.has(k)) s.delete(k)
    else s.add(k)
    setKinds(s)
  }
  const zoneName = zone === 'utc' ? 'UTC' : 'local time'

  return (
    <div class="events-view">
      <section class="controls" aria-label="Navigation and filters">
        <div class="control-row">
          <label>
            Date{' '}
            <input
              type="date"
              value={formatDate(anchor, zone)}
              min="1850-01-01"
              max="2149-12-31"
              onInput={(e) => {
                const a = parseDate(e.currentTarget.value, zone)
                if (a !== null) setAnchor(a)
              }}
            />
          </label>
          <button type="button" onClick={() => setAnchor(now)}>
            Now
          </button>
          <span class="button-group">
            <button type="button" onClick={() => step(-PAGE)} aria-label={`${PAGE} events earlier`}>
              ⏪
            </button>
            <button type="button" onClick={() => step(-1)}>
              ◀ Previous event
            </button>
            <button type="button" onClick={() => step(1)}>
              Next event ▶
            </button>
            <button type="button" onClick={() => step(PAGE)} aria-label={`${PAGE} events later`}>
              ⏩
            </button>
          </span>
          <fieldset class="zone">
            <legend class="visually-hidden">Time zone</legend>
            <label>
              <input type="radio" name="zone" checked={zone === 'utc'} onChange={() => setZone('utc')} /> UTC
            </label>
            <label>
              <input type="radio" name="zone" checked={zone === 'local'} onChange={() => setZone('local')} /> Local
              time
            </label>
          </fieldset>
        </div>
        <fieldset class="control-row kinds">
          <legend class="visually-hidden">Kinds of events</legend>
          {NOTABLE_KINDS.map((k) => (
            <label key={k} class={`kind kind-${k}`}>
              <input type="checkbox" checked={kinds.has(k)} onChange={() => toggleKind(k)} /> {KIND_LABELS[k]}
            </label>
          ))}
          <label class="kind kind-ordinary">
            <input type="checkbox" checked={includeOrdinary} onChange={() => setIncludeOrdinary(!includeOrdinary)} />{' '}
            Other New and Full Moons
          </label>
        </fieldset>
      </section>

      <p class="next-summary" data-testid="next-summary" aria-live="polite">
        {next ? (
          <>
            Next: <strong>{eventLabel(next)}</strong> on {formatDateTime(next.syzygy.time, zone)}{' '}
            {zone === 'utc' ? 'UTC' : ''} ({formatRelative(next.syzygy.time, anchor)}),{' '}
            {describeDelta(next)}.
          </>
        ) : (
          'No more events in the data.'
        )}
      </p>

      <div class="table-wrap">
        <table class="events">
          <caption class="visually-hidden">New and Full Moons near perigee and apogee, times in {zoneName}</caption>
          <thead>
            <tr>
              <th scope="col">When</th>
              <th scope="col">Date and time ({zone === 'utc' ? 'UTC' : 'local'})</th>
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
                <EventRow key={e.syzygy.time} event={e} anchor={anchor} zone={zone} isNext={index === nextIndex} />,
              ]
            })}
            {nextIndex >= end && <AnchorRow anchor={anchor} zone={zone} />}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function describeDelta(e: MoonEvent): string {
  const d = e.deltaDays
  const amount = formatDuration(d).replace(/^[+−]/, '')
  return `${amount} ${d >= 0 ? 'before' : 'after'} ${e.apsis}`
}

function AnchorRow({ anchor, zone }: { anchor: number; zone: Zone }) {
  return (
    <tr class="anchor-row">
      <td colSpan={8}>▼ selected moment: {formatDateTime(anchor, zone)}</td>
    </tr>
  )
}

function EventRow({ event: e, anchor, zone, isNext }: { event: MoonEvent; anchor: number; zone: Zone; isNext: boolean }) {
  const kind = notableKind(e) ?? 'ordinary'
  const close = Math.abs(e.deltaDays) < CLOSE_ALIGNMENT_DAYS
  const classes = [e.syzygy.time < anchor ? 'past' : '', isNext ? 'next' : '', close ? 'close-alignment' : '']
  return (
    <tr class={classes.filter(Boolean).join(' ')} data-time={e.syzygy.time} aria-current={isNext ? 'true' : undefined}>
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
