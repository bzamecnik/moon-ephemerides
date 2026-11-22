import { useEffect, useRef } from 'preact/hooks'
import { ALL, describeFilter, ECLIPSE_KEYS, MOON_KINDS, toggle, type EclipseKey, type Filter, type MoonKind } from '../filters'
import { EclipseIcon, PhaseIcon } from './cells'
import { classify } from '../events'
import { Icon } from './Icon'

const MOON_LABELS: Record<MoonKind, string> = {
  'new-super': 'New Supermoon',
  'full-super': 'Full Supermoon',
  'new-micro': 'New Micromoon',
  'full-micro': 'Full Micromoon',
  'new-ordinary': 'other New Moon',
  'full-ordinary': 'other Full Moon',
}

const ECLIPSE_LABELS: Record<EclipseKey, string> = {
  'solar-total': 'total solar',
  'solar-annular': 'annular solar',
  'solar-partial': 'partial solar',
  'lunar-total': 'total lunar',
  'lunar-partial': 'partial lunar',
  'lunar-penumbral': 'penumbral lunar',
}

/** a stand-in event, for drawing the icon of a kind */
function sampleEvent(k: MoonKind) {
  const [phase, kind] = k.split('-')
  const r = kind === 'super' ? 0 : kind === 'micro' ? 1 : 0.5
  return classify({
    time: 0,
    phase: phase as 'new' | 'full',
    distanceKm: 0,
    perigeeDeltaDays: 0,
    apogeeDeltaDays: 0,
    relativeDistance: r,
    eclipse: null,
  })
}

/** "Show: all ▾": a pop-up with the kinds of New and Full Moons and of eclipses. */
export function FilterMenu({ filter, onChange }: { filter: Filter; onChange: (f: Filter) => void }) {
  const menu = useRef<HTMLDetailsElement>(null)
  // close on a click outside or Escape
  useEffect(() => {
    const close = (e: Event) => {
      const d = menu.current
      if (!d?.open) return
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !d.contains(e.target as Node)) d.open = false
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', close)
    }
  }, [])

  return (
    <details class="menu" ref={menu}>
      <summary title="Which New and Full Moons to list and step through">
        <Icon name="funnel" /> Show: {describeFilter(filter)} <Icon name="chevronDown" />
      </summary>
      <div class="menu-panel">
        <fieldset>
          <legend>New and Full Moons</legend>
          {MOON_KINDS.map((k) => (
            <label key={k}>
              <input
                type="checkbox"
                checked={filter.moons.has(k)}
                onChange={() => onChange({ ...filter, moons: toggle(filter.moons, k) })}
              />{' '}
              <PhaseIcon event={sampleEvent(k)} /> {MOON_LABELS[k]}
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>Eclipses</legend>
          <label>
            <input
              type="checkbox"
              checked={filter.onlyEclipses}
              onChange={() => onChange({ ...filter, onlyEclipses: !filter.onlyEclipses })}
            />{' '}
            only eclipses
          </label>
          {ECLIPSE_KEYS.map((k) => {
            const [body, kind] = k.split('-') as ['solar' | 'lunar', 'total']
            return (
              <label key={k} class="indented">
                <input
                  type="checkbox"
                  disabled={!filter.onlyEclipses}
                  checked={filter.eclipses.has(k)}
                  onChange={() => onChange({ ...filter, eclipses: toggle(filter.eclipses, k) })}
                />{' '}
                <EclipseIcon eclipse={{ body, kind }} /> {ECLIPSE_LABELS[k]}
              </label>
            )
          })}
        </fieldset>
        <button type="button" onClick={() => onChange(ALL)} disabled={describeFilter(filter) === 'all'}>
          Show all
        </button>
      </div>
    </details>
  )
}
