import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import type { Catalog } from '../data/catalog'
import {
  eclipseLabel,
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
import { DistanceChart } from '../charts/DistanceChart'
import { LongTermChart } from '../charts/LongTermChart'
import { OrbitChart } from '../charts/OrbitChart'
import { PhaseChart } from '../charts/PhaseChart'
import { anomalisticMarks, synodicMarks } from '../phase'
import { EventTable } from './EventTable'
import { Icon } from './Icon'
import { RankingView } from './RankingView'
import { cycleStep, nextPlayAnchor, playInterval, PLAY_STEPS, type PlayStep } from '../playback'
import { shortcutAction, SHORTCUTS } from '../shortcuts'
import { BEAT_DAYS, closestIndex, firstIndexAtOrAfter, stepAnchor, stepByTime, windowAround } from '../timeline'

const ROWS_BEFORE = 6
const ROWS_AFTER = 14
const BEAT_MS = BEAT_DAYS * 86_400_000

type View = 'table' | 'distance' | 'orbit' | 'beat' | 'phase' | 'longterm' | 'ranking'
const withArticle = (s: string) => `${/^[aeiou]/.test(s) ? 'an' : 'a'} ${s}`

const VIEWS: { id: View; label: string }[] = [
  { id: 'table', label: 'Table' },
  { id: 'distance', label: 'Distance' },
  { id: 'orbit', label: 'Orbit from above' },
  { id: 'beat', label: 'Beat of the rhythms' },
  { id: 'phase', label: 'Phase vs. distance' },
  { id: 'longterm', label: 'Long term' },
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
  /** the current time, for "Now" and live play (replaceable in tests) */
  clock?: () => number
  /** called when the user picks a moment (to keep it in the URL) */
  onChange?: (anchor: number, view: string) => void
}

export function EventsView({ catalog, initialAnchor, initialView, clock = Date.now, onChange }: Props) {
  const [anchor, setAnchorState] = useState(initialAnchor)
  const [zone, setZone] = useState<Zone>('utc')
  const [kinds, setKinds] = useState<ReadonlySet<NotableKind>>(new Set(NOTABLE_KINDS))
  const [includeOrdinary, setIncludeOrdinary] = useState(true)
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

  const allTimes = useMemo(() => allEvents.map((e) => e.syzygy.time), [allEvents])
  const setAnchor = (a: number) => {
    setAnchorState(a)
    onChange?.(a, view)
  }

  // ▶ Play: the moment moves forward by the chosen step, until the end of the data or a pause
  const [playing, setPlaying] = useState(false)
  const [playStep, setPlayStep] = useState<PlayStep>('beat')
  useEffect(() => {
    if (!playing) return
    const tick = () => {
      const next = nextPlayAnchor(playStep, anchor, allTimes, clock())
      if (next === null) setPlaying(false)
      else setAnchor(next)
    }
    // live starts at once, then follows the clock every minute
    if (playStep === 'live' && Math.abs(anchor - clock()) > 60_000) {
      tick()
      return
    }
    const timer = setTimeout(tick, playInterval(playStep))
    return () => clearTimeout(timer)
  }, [playing, playStep, anchor, allTimes])

  // a step by hand stops the animation
  const goTo = (a: number) => {
    setPlaying(false)
    setAnchor(a)
  }
  const step = (n: number) => goTo(stepAnchor(times, anchor, n))
  // by a beat: the same phase, whatever the filters
  const stepBeat = (n: number) => goTo(stepByTime(allTimes, anchor, n * BEAT_MS))

  const dateInput = useRef<HTMLInputElement>(null)
  const [showKeys, setShowKeys] = useState(false)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const action = shortcutAction(e, {
        inField: !!target?.closest('input, select, textarea, [contenteditable]'),
        onButton: !!target?.closest('button, a, summary'),
      })
      if (e.key === 'Escape') setShowKeys(false)
      if (!action) return
      e.preventDefault()
      switch (action.type) {
        case 'step':
          return step(action.n)
        case 'beat':
          return stepBeat(action.n)
        case 'play':
          return setPlaying(!playing)
        case 'now':
          return goTo(clock())
        case 'date':
          dateInput.current?.focus()
          return dateInput.current?.select()
        case 'view':
          return setView(VIEWS[action.index].id)
        case 'speed':
          return setPlayStep(cycleStep(playStep, action.dir))
        case 'help':
          return setShowKeys(!showKeys)
      }
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
          <DateField anchor={anchor} zone={zone} onChange={goTo} inputRef={dateInput} />
          <span class="segmented" role="group" aria-label="Time zone">
            <button
              type="button"
              aria-pressed={zone === 'utc'}
              onClick={() => setZone('utc')}
              title="Show times in UTC (Coordinated Universal Time)"
            >
              UTC
            </button>
            <button
              type="button"
              aria-pressed={zone === 'local'}
              onClick={() => setZone('local')}
              title={`Show times in your local time: ${localZoneName()}, ${formatOffset(anchor)}`}
            >
              Local
            </button>
          </span>
        </div>
        <div class="control-row">
          <span class="button-group">
            <button
              type="button"
              class="icon-button"
              onClick={() => stepBeat(-1)}
              aria-label="One beat earlier"
              title="One beat earlier: the same phase about 14 months before (Shift+←)"
            >
              <Icon name="backward" />
            </button>
            <button
              type="button"
              class="icon-button"
              onClick={() => step(-1)}
              aria-label="Previous event"
              title="Previous New or Full Moon (←)"
            >
              <Icon name="chevronLeft" />
            </button>
            <button type="button" class="icon-button" onClick={() => goTo(clock())} aria-label="Now" title="Now (N)">
              <Icon name="clock" />
            </button>
            <button
              type="button"
              class="icon-button"
              onClick={() => step(1)}
              aria-label="Next event"
              title="Next New or Full Moon (→)"
            >
              <Icon name="chevronRight" />
            </button>
            <button
              type="button"
              class="icon-button"
              onClick={() => stepBeat(1)}
              aria-label="One beat later"
              title="One beat later: the same phase about 14 months after (Shift+→)"
            >
              <Icon name="forward" />
            </button>
          </span>
          <span class="button-group">
            <button
              type="button"
              class="icon-button play"
              aria-pressed={playing}
              aria-label={playing ? 'Pause' : 'Play'}
              onClick={() => setPlaying(!playing)}
              title={playing ? 'Pause (Space)' : 'Play: step forward again and again (Space)'}
            >
              <Icon name={playing ? 'pause' : 'play'} />
            </button>
            <select
              aria-label="Play step"
              title="Play step ([ and ] keys)"
              value={playStep}
              onChange={(e) => setPlayStep(e.currentTarget.value as PlayStep)}
            >
              {PLAY_STEPS.map((p) => (
                <option key={p.id} value={p.id} title={p.title}>
                  {p.id === 'live' ? 'live' : `by ${p.label}`}
                </option>
              ))}
            </select>
          </span>
          <button
            type="button"
            class="icon-button"
            aria-label="Keyboard shortcuts"
            aria-expanded={showKeys}
            title="Keyboard shortcuts (?)"
            onClick={() => setShowKeys(!showKeys)}
          >
            <Icon name="question" />
          </button>
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
        {showKeys && (
          <dl class="keys-panel" aria-label="Keyboard shortcuts">
            {SHORTCUTS.map(([keys, what]) => (
              <div key={what}>
                <dt>
                  {keys.map((k) => (k === '…' ? ' … ' : <kbd key={k}>{k}</kbd>))}
                </dt>
                <dd>{what}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <p class="summary" data-testid="summary" aria-live="polite">
        {closestEvent ? (
          <>
            Closest: <strong>{eventLabel(closestEvent)}</strong> on {formatZoned(closestEvent.syzygy.time, zone)} (
            {formatRelative(closestEvent.syzygy.time, anchor)}), {describeDelta(closestEvent)}
            {closestEvent.syzygy.eclipse && <>, with {withArticle(eclipseLabel(closestEvent.syzygy.eclipse))}</>}.
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
            onSelect={setAnchor}
          />
        )}
        {view === 'distance' && (
          <DistanceChart
            events={allEvents}
            apsides={catalog.apsides}
            anchor={anchor}
            closestTime={closestEvent?.syzygy.time}
            zone={zone}
            onSelect={setAnchor}
          />
        )}
        {view === 'orbit' && (
          <OrbitChart
            events={allEvents}
            apsides={catalog.apsides}
            anchor={anchor}
            closestTime={closestEvent?.syzygy.time}
            zone={zone}
            onSelect={setAnchor}
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
        {view === 'longterm' && (
          <LongTermChart
            events={allEvents}
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
function DateField({
  anchor,
  zone,
  onChange,
  inputRef,
}: {
  anchor: number
  zone: Zone
  onChange: (a: number) => void
  inputRef?: preact.Ref<HTMLInputElement>
}) {
  // the text being typed; null when not editing
  const [draft, setDraft] = useState<string | null>(null)
  const picker = useRef<HTMLInputElement>(null)
  const shown = formatDateTime(anchor, zone)
  const invalid = draft !== null && parseDateTime(draft, zone) === null

  return (
    <span class="date-field">
      <label>
        <span class="visually-hidden">Date and time</span>
        <input
          ref={inputRef}
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
        class="icon-button"
        aria-label="Choose a date from a calendar"
        title="Choose a date from a calendar"
        onClick={() => picker.current?.showPicker?.()}
      >
        <Icon name="calendar" />
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
