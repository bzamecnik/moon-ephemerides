/** Shared marks of the charts: one symbol per New/Full Moon, a legend. */
import { eventLabel, notableKind, type MoonEvent } from '../events'
import { formatDelta, formatZoned, type Zone } from '../format'

/** CSS class giving the colour: super- (warm), micro- (cool) or ordinary (grey) */
export function markClass(e: MoonEvent): string {
  return `mark mark-${e.kind} ${e.syzygy.phase === 'new' ? 'mark-new' : 'mark-full'}`
}

export function describeEvent(e: MoonEvent, zone: Zone): string {
  const apsis = notableKind(e) ? `, Δ ${e.apsis} ${formatDelta(e.deltaDays)} d` : ''
  return `${eventLabel(e)}, ${formatZoned(e.syzygy.time, zone)}${apsis}`
}

interface MarkProps {
  event: MoonEvent
  x: number
  y: number
  zone: Zone
  highlighted?: boolean
  onSelect?: (time: number) => void
}

/** New Moon = filled disc, Full Moon = ring; ordinary ones smaller. A larger invisible hit area with a tooltip. */
export function EventMark({ event, x, y, zone, highlighted, onSelect }: MarkProps) {
  const r = event.kind === 'ordinary' ? 3 : 4.5
  return (
    <g class="event-mark" onClick={onSelect && (() => onSelect(event.syzygy.time))}>
      {highlighted && <circle class="mark-highlight" cx={x} cy={y} r={r + 5} />}
      <circle class={markClass(event)} cx={x} cy={y} r={r} />
      <circle class="hit" cx={x} cy={y} r={9}>
        <title>{describeEvent(event, zone)}</title>
      </circle>
    </g>
  )
}

const LEGEND: { cls: string; label: string }[] = [
  { cls: 'mark mark-super mark-new', label: 'New Supermoon' },
  { cls: 'mark mark-super mark-full', label: 'Full Supermoon' },
  { cls: 'mark mark-micro mark-new', label: 'New Micromoon' },
  { cls: 'mark mark-micro mark-full', label: 'Full Micromoon' },
  { cls: 'mark mark-ordinary mark-new', label: 'other New Moon' },
  { cls: 'mark mark-ordinary mark-full', label: 'other Full Moon' },
]

export function Legend() {
  return (
    <ul class="legend" aria-label="Legend">
      {LEGEND.map(({ cls, label }) => (
        <li key={label}>
          <svg width="14" height="14" viewBox="-7 -7 14 14" aria-hidden="true">
            <circle class={cls} r={4.5} />
          </svg>
          {label}
        </li>
      ))}
    </ul>
  )
}
