import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import type { Catalog } from '../data/catalog'
import {
  eventLabel,
  moonEvents,
  NOTABLE_KINDS,
  type MoonEvent,
  type NotableKind,
} from '../events'
import {
  formatDate,
  formatDateTime,
  formatDuration,
  formatOffset,
  formatRelative,
  formatZoned,
  localZoneName,
  parseDateTime,
  type Zone,
} from '../format'
import { BeatChart } from '../charts/BeatChart'
import { PhaseChart } from '../charts/PhaseChart'
import { anomalisticMarks, synodicMarks } from '../phase'
import { EventTable } from './EventTable'
import { RankingView } from './RankingView'
import { closestIndex, firstIndexAtOrAfter, stepAnchor, windowAround } from '../timeline'

const ROWS_BEFORE = 6
const ROWS_AFTER = 14
const PAGE = 10

type View = 'table' | 'beat' | 'phase' | 'ranking'
const VIEWS: { id: View; label: string }[] = [
  { id: 'table', label: 'Table' },
  { id: 'beat', label: 'Beat of the rhythms' },
  { id: 'phase', label: 'Phase vs. distance' },
  { id: 'ranking', label: 'Best alignments' },
]

const KIND_LABELS: Record<NotableKind, string> = {
  'new-super': 'New Supermoon',
  'full-super': 'Full Supermoon',
  'new-micro': 'New Micromoon',
  'full-micro': 'Full Micromoon',
}

interface Props {
  catalog: Catalog
  initialAnchor: number
  initialView?: string | null
  /** the current time, for the "Now" button */
  now: number
  /** called when the user picks a moment (to keep it in the URL) */
  onChange?: (anchor: number, view: string) => void
}

export function EventsView({ catalog, initialAnchor, initialView, now, onChange }: Props) {
  const [anchor, setAnchorState] = useState(initialAnchor)
  const [zone, setZone] = useState<Zone>('utc')
  const [kinds, setKinds] = useState<ReadonlySet<NotableKind>>(new Set(NOTABLE_KINDS))
  const [includeOrdinary, setIncludeOrdinary] = useState(false)
  const [view, setViewState] = useState<View>(VIEWS.find((v) => v.id === initialView)?.id ?? 'table')
  const setView = (v: View) => {
    setViewState(v)
    onChange?.(anchor, v)
  }
  // the charts show every New and Full Moon, whatever the filters
  const allEvents = useMemo(() => moonEvents(catalog.syzygies, { includeOrdinary: true }), [catalog])
  const synodic = useMemo(() => synodicMarks(catalog.syzygies), [catalog])
  const anomalistic = useMemo(() => anomalisticMarks(catalog.apsides), [catalog])

  const events = useMemo(
    () => moonEvents(catalog.syzygies, { kinds, includeOrdinary }),
    [catalog, kinds, includeOrdinary],
  )
  const times = useMemo(() => events.map((e) => e.syzygy.time), [events])
  const closest = closestIndex(times, anchor)
  // the line marking the selected moment goes before this event
  const nextIndex = firstIndexAtOrAfter(times, anchor)
  const { start, end } = windowAround(events.length, closest, ROWS_BEFORE, ROWS_AFTER)
  const closestEvent: MoonEvent | undefined = events[closest]

  const setAnchor = (a: number) => {
    setAnchorState(a)
    onChange?.(a, view)
  }
  const step = (n: number) => setAnchor(stepAnchor(times, anchor, n))

  // ← / → step by one event, with Shift by ten; not while typing in a field
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      if (e.altKey || e.ctrlKey || e.metaKey) return
      const target = e.target as HTMLElement | null
      if (target?.closest('input, select, textarea, [contenteditable]')) return
      e.preventDefault()
      step((e.key === 'ArrowRight' ? 1 : -1) * (e.shiftKey ? PAGE : 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
  const toggleKind = (k: NotableKind) => {
    const s = new Set(kinds)
    if (s.has(k)) s.delete(k)
    else s.add(k)
    setKinds(s)
  }

  return (
    <div class="events-view">
      <section class="controls" aria-label="Navigation and filters">
        <div class="control-row">
          <DateField anchor={anchor} zone={zone} onChange={setAnchor} />
          <button type="button" onClick={() => setAnchor(now)}>
            Now
          </button>
          <span class="button-group">
            <button type="button" onClick={() => step(-PAGE)} aria-label={`${PAGE} events earlier`}>
              ⏪
            </button>
            <button type="button" onClick={() => step(-1)} title="Previous event (← key, Shift+← for ten)">
              ◀ Previous event
            </button>
            <button type="button" onClick={() => step(1)} title="Next event (→ key, Shift+→ for ten)">
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
              time ({localZoneName()}, {formatOffset(anchor)})
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
        <p class="hint keys">
          Tip: <kbd>←</kbd> and <kbd>→</kbd> step through the events, with <kbd>Shift</kbd> by ten.
        </p>
      </section>

      <p class="summary" data-testid="summary" aria-live="polite">
        {closestEvent ? (
          <>
            Closest: <strong>{eventLabel(closestEvent)}</strong> on {formatZoned(closestEvent.syzygy.time, zone)} (
            {formatRelative(closestEvent.syzygy.time, anchor)}), {describeDelta(closestEvent)}.
          </>
        ) : (
          'No events of the chosen kinds.'
        )}
      </p>

      <div class="tabs" role="tablist" aria-label="Views">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            role="tab"
            id={`tab-${v.id}`}
            aria-selected={view === v.id}
            aria-controls="view-panel"
            onClick={() => setView(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>
      <div class="view-panel" id="view-panel" role="tabpanel" aria-labelledby={`tab-${view}`}>
        {view === 'table' && (
          <EventTable
            events={events}
            start={start}
            end={end}
            closest={closest}
            nextIndex={nextIndex}
            anchor={anchor}
            zone={zone}
          />
        )}
        {view === 'beat' && (
          <BeatChart
            events={allEvents}
            anchor={anchor}
            closestTime={closestEvent?.syzygy.time}
            zone={zone}
            onSelect={setAnchor}
          />
        )}
        {view === 'phase' && (
          <PhaseChart
            events={allEvents}
            synodic={synodic}
            anomalistic={anomalistic}
            anchor={anchor}
            closestTime={closestEvent?.syzygy.time}
            zone={zone}
            onSelect={setAnchor}
          />
        )}
        {view === 'ranking' && (
          <RankingView
            events={events}
            zone={zone}
            onSelect={(t) => {
              setAnchorState(t)
              setViewState('table')
              onChange?.(t, 'table')
            }}
          />
        )}
      </div>
    </div>
  )
}

/**
 * The selected moment as editable 'YYYY-MM-DD HH:MM' text (a native date input
 * would show the browser's locale format and is awkward for typing years),
 * plus the browser's calendar behind a button. While typing, every valid
 * prefix ('1989', '1989-05', '1989-05-07', '1989-05-07 13:45') already moves
 * the selection.
 */
function DateField({ anchor, zone, onChange }: { anchor: number; zone: Zone; onChange: (a: number) => void }) {
  // the text being typed; null when not editing
  const [draft, setDraft] = useState<string | null>(null)
  const picker = useRef<HTMLInputElement>(null)
  const shown = formatDateTime(anchor, zone)
  const invalid = draft !== null && parseDateTime(draft, zone) === null

  return (
    <span class="date-field">
      <label>
        Date and time{' '}
        <input
          type="text"
          inputMode="numeric"
          placeholder="YYYY-MM-DD HH:MM"
          size={16}
          maxLength={16}
          spellcheck={false}
          autoComplete="off"
          value={draft ?? shown}
          aria-invalid={invalid ? 'true' : undefined}
          title="A date and optionally a time, e.g. 1989, 1989-05, 1989-05-07 or 1989-05-07 13:45"
          onFocus={(e) => setDraft(e.currentTarget.value)}
          onInput={(e) => {
            const text = e.currentTarget.value
            setDraft(text)
            const a = parseDateTime(text, zone)
            if (a !== null) onChange(a)
          }}
          onBlur={() => setDraft(null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Escape') {
              setDraft(null)
              e.currentTarget.select()
            }
          }}
        />
      </label>
      <button
        type="button"
        aria-label="Choose a date from a calendar"
        title="Choose a date from a calendar"
        onClick={() => picker.current?.showPicker?.()}
      >
        📅
      </button>
      <input
        ref={picker}
        type="date"
        class="date-picker"
        data-testid="date-picker"
        tabIndex={-1}
        aria-hidden="true"
        min="1850-01-01"
        max="2149-12-31"
        value={formatDate(anchor, zone)}
        onChange={(e) => {
          const a = parseDateTime(e.currentTarget.value, zone)
          if (a !== null) onChange(a)
        }}
      />
    </span>
  )
}

function describeDelta(e: MoonEvent): string {
  const d = e.deltaDays
  const amount = formatDuration(d).replace(/^[+−]/, '')
  return `${amount} ${d >= 0 ? 'before' : 'after'} ${e.apsis}`
}
