import { useEffect, useState } from 'preact/hooks'
import { loadCatalog, type Catalog } from '../data/catalog'
import { formatHash, parseHash, parseHashPage, parseHashView, type Page } from '../format'
import { EventsView } from './EventsView'
import { Icon } from './Icon'
import { LearnPage } from './LearnPage'

const DATA_URL = `${import.meta.env.BASE_URL}data/lunar-events.json`

/** The moment selected in the URL (#date=YYYY-MM-DD[THH:MM], UTC), else now. */
function initialAnchor(now: number): number {
  return parseHash(window.location.hash) ?? now
}

/** the explorer's last URL, to come back to from the learning page */
let exploreHash = ''

function keepInUrl(anchor: number, view: string) {
  exploreHash = formatHash(anchor, view)
  window.history.replaceState(null, '', exploreHash)
}

export function App() {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [now] = useState(() => Date.now())
  const [page, setPage] = useState<Page>(() => {
    const p = parseHashPage(window.location.hash)
    if (p.page === 'explore') exploreHash = window.location.hash
    return p
  })
  useEffect(() => {
    const onHash = () => setPage(parseHashPage(window.location.hash))
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    loadCatalog(DATA_URL).then(setCatalog, (e: unknown) => setError(String(e)))
  }, [])

  return (
    <>
      <header>
        <h1>Moon Ephemerides</h1>
        <nav class="pages" aria-label="Pages">
          <a href={exploreHash || '#'} aria-current={page.page === 'explore' ? 'page' : undefined}>
            Explore
          </a>
          <a href="#learn" aria-current={page.page === 'learn' ? 'page' : undefined}>
            Learn: the astronomy behind it
          </a>
        </nav>
        {page.page === 'explore' && (
          <details class="about">
            <summary title="What is this page about?">
              <Icon name="info" /> About
            </summary>
            <p class="intro">
            The Moon's phases repeat every 29.5 days, its closest approach to Earth (perigee) every 27.6 days. When a New
            or Full Moon falls near perigee it is a <em>supermoon</em>; near the farthest point (apogee), a{' '}
            <em>micromoon</em>. The two rhythms drift in and out of step every ~412 days. <strong>Δ</strong> is the time
            from the New or Full Moon to the perigee or apogee: the closer to zero, the better the two rhythms line up.{' '}
            <a href="#learn">More about the astronomy behind it.</a>
            </p>
          </details>
        )}
      </header>
      <main>
        {page.page === 'learn' && <LearnPage section={page.section} />}
        {page.page === 'explore' && error && <p role="alert">Could not load the data: {error}</p>}
        {page.page === 'explore' && !catalog && !error && <p>Loading…</p>}
        {page.page === 'explore' && catalog && (
          <EventsView
            catalog={catalog}
            initialAnchor={initialAnchor(now)}
            initialView={parseHashView(window.location.hash)}
            onChange={keepInUrl}
          />
        )}
      </main>
      <footer>
        <p>
          Moon Ephemerides {__APP_VERSION__} ·{' '}
          <a href="https://github.com/bzamecnik/moon-ephemerides">source code and documentation</a>
        </p>
        {catalog && (
          <p>
            Computed with <a href="https://rhodesmill.org/skyfield/">Skyfield</a> from NASA's {catalog.ephemeris}{' '}
            ephemeris (data generated {catalog.generated.slice(0, 10)}), years 1850–2149; solar eclipses and the
            Moon's position between events with <a href="https://github.com/cosinekitty/astronomy">astronomy-engine</a>.
            Definitions after Fred
            Espenak's tables at <a href="https://astropixels.com/ephemeris/moon/fullperigee2001.html">astropixels.com</a>
            : supermoon = within 10 % of the perigee distance, micromoon = within 10 % of the apogee distance (of the
            perigee–apogee span of that orbit).
          </p>
        )}
      </footer>
    </>
  )
}
