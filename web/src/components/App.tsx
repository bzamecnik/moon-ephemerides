import { useEffect, useState } from 'preact/hooks'
import { loadCatalog, type Catalog } from '../data/catalog'
import { formatHash, parseHash, parseHashPage, parseHashView, type Page } from '../format'
import { EventsView } from './EventsView'
import { AboutPage } from './AboutPage'
import { Layout, SiteHeader } from './Layout'
import { LearnPage } from './LearnPage'

const DATA_URL = `${import.meta.env.BASE_URL}data/lunar-events.json`

/** The moment selected in the URL (#date=YYYY-MM-DD[THH:MM], UTC), else now. */
function initialAnchor(now: number): number {
  return parseHash(window.location.hash) ?? now
}

/** the explorer's last URL, to come back to from the other pages */
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

  const header = <SiteHeader page={page.page} exploreHash={exploreHash} />
  if (page.page === 'learn') return <LearnPage section={page.section} header={header} />
  if (page.page === 'about') return <AboutPage header={header} catalog={catalog} />
  if (!catalog)
    return (
      <Layout header={header}>
        {error ? <p role="alert">Could not load the data: {error}</p> : <p>Loading…</p>}
      </Layout>
    )
  return (
    <EventsView
      catalog={catalog}
      header={header}
      initialAnchor={initialAnchor(now)}
      initialView={parseHashView(window.location.hash)}
      onChange={keepInUrl}
    />
  )
}
