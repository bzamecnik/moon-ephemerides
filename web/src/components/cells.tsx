/** Table cells shared by the event table and the ranking. */
import type { ApsisKind, Eclipse } from '../data/catalog'
import { eclipseLabel, type MoonEvent } from '../events'
import { formatDateTime, formatDelta, formatDuration, formatZoned, type Zone } from '../format'
import { markClass } from '../charts/marks'

const PHASE_NAMES = { new: 'New', full: 'Full' }
const KIND_NAMES = { super: 'Supermoon', micro: 'Micromoon', ordinary: '' }

/** The same symbol as in the charts: New Moon the darker disc, Full Moon the brighter; colour by kind. */
export function PhaseIcon({ event }: { event: MoonEvent }) {
  return (
    <svg class="icon" width="14" height="14" viewBox="-7 -7 14 14" aria-hidden="true">
      <circle class={markClass(event)} r={event.kind === 'ordinary' ? 3.5 : 4.5} />
    </svg>
  )
}

/** Perigee ▼ (the bottom of the distance wave), apogee ▲ (its top). */
export function ApsisIcon({ kind }: { kind: ApsisKind }) {
  return (
    <svg class={`icon apsis-icon apsis-${kind}`} width="14" height="14" viewBox="-7 -7 14 14" aria-hidden="true">
      <path d={kind === 'perigee' ? 'M -5 -3.5 L 5 -3.5 L 0 4.5 Z' : 'M -5 3.5 L 5 3.5 L 0 -4.5 Z'} />
    </svg>
  )
}

/** Solar eclipse: the dark Moon inside a bright ring; lunar eclipse: the Moon tinted by the Earth's shadow. */
export function EclipseIcon({ eclipse }: { eclipse: Eclipse }) {
  return (
    <svg class={`icon eclipse-icon eclipse-${eclipse.body}`} width="14" height="14" viewBox="-7 -7 14 14" aria-hidden="true">
      <circle r={eclipse.body === 'solar' ? 3.5 : 4.5} />
    </svg>
  )
}

export function EclipseCell({ event }: { event: MoonEvent }) {
  const e = event.syzygy.eclipse
  const label = e && eclipseLabel(e)
  return (
    <td class="eclipse" data-testid="eclipse">
      {e && label && (
        <>
          <EclipseIcon eclipse={e} /> {label[0].toUpperCase() + label.slice(1, -' eclipse'.length)}
        </>
      )}
    </td>
  )
}

export function PhaseCell({ event }: { event: MoonEvent }) {
  return (
    <td class="phase" data-testid="phase">
      <PhaseIcon event={event} /> {PHASE_NAMES[event.syzygy.phase]}
    </td>
  )
}

export function KindCell({ event }: { event: MoonEvent }) {
  return (
    <td class="kind-name" data-testid="kind">
      {KIND_NAMES[event.kind]}
    </td>
  )
}

export function ApsisCell({ event }: { event: MoonEvent }) {
  return (
    <td class="apsis">
      <ApsisIcon kind={event.apsis} /> {event.apsis}
    </td>
  )
}

/** A date that selects its moment when clicked. */
export function TimeButton({
  time,
  zone,
  onSelect,
  label,
}: {
  time: number
  zone: Zone
  onSelect?: (time: number) => void
  label?: string
}) {
  const text = formatDateTime(time, zone)
  if (!onSelect) return <>{text}</>
  return (
    <button type="button" class="time-button" title={`Select ${label ?? formatZoned(time, zone)}`} onClick={() => onSelect(time)}>
      {text}
    </button>
  )
}

/** Δ in days (decimal points aligned) and in plain units, as two cells. */
export function DeltaCells({ event }: { event: MoonEvent }) {
  return (
    <>
      <td class="num delta" data-testid="delta">
        {formatDelta(event.deltaDays)}
      </td>
      <td class="delta-human">{formatDuration(event.deltaDays)}</td>
    </>
  )
}

/** "New Supermoon", "Full Moon", ... as the two cells read together (for tests and labels) */
export function cellLabel(row: HTMLElement): string {
  const phase = row.querySelector('[data-testid=phase]')?.textContent?.trim()
  const kind = row.querySelector('[data-testid=kind]')?.textContent?.trim()
  return `${phase} ${kind || 'Moon'}`
}
