import { useEffect, useState } from 'preact/hooks'
import { loadCatalog, type Catalog } from '../data/catalog'
import { formatHash, parseHash, parseHashView } from '../format'
import { EventsView } from './EventsView'

const DATA_URL = `${import.meta.env.BASE_URL}data/lunar-events.json`

/** The moment selected in the URL (#date=YYYY-MM-DD[THH:MM], UTC), else now. */
function initialAnchor(now: number): number {
  return parseHash(window.location.hash) ?? now
}

function keepInUrl(anchor: number, view: string) {
  window.history.replaceState(null, '', formatHash(anchor, view))
}

export function App() {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [now] = useState(() => Date.now())

  useEffect(() => {
    loadCatalog(DATA_URL).then(setCatalog, (e: unknown) => setError(String(e)))
  }, [])

  return (
    <>
      <header>
        <h1>Moon Ephemerides</h1>
        <p class="intro">
          The Moon's phases repeat every 29.5 days, its closest approach to Earth (perigee) every 27.6 days. When a New
          or Full Moon falls near perigee it is a <em>supermoon</em>; near the farthest point (apogee), a{' '}
          <em>micromoon</em>. The two rhythms drift in and out of step every ~412 days. <strong>Δ</strong> is the time
          from the New or Full Moon to the perigee or apogee: the closer to zero, the better the two rhythms line up.
        </p>
      </header>
      <main>
        {error && <p role="alert">Could not load the data: {error}</p>}
        {!catalog && !error && <p>Loading…</p>}
        {catalog && (
          <EventsView
            catalog={catalog}
            initialAnchor={initialAnchor(now)}
            initialView={parseHashView(window.location.hash)}
            now={now}
            onChange={keepInUrl}
          />
        )}
      </main>
      <footer>
        {catalog && (
          <p>
            Computed with <a href="https://rhodesmill.org/skyfield/">Skyfield</a> from NASA's {catalog.ephemeris}{' '}
            ephemeris (data generated {catalog.generated.slice(0, 10)}), years 1850–2149. Definitions after Fred
            Espenak's tables at <a href="https://astropixels.com/ephemeris/moon/fullperigee2001.html">astropixels.com</a>
            : supermoon = within 10 % of the perigee distance, micromoon = within 10 % of the apogee distance (of the
            perigee–apogee span of that orbit).
          </p>
        )}
      </footer>
    </>
  )
}
