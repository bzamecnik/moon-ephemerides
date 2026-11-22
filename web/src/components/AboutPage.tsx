import type { ComponentChildren } from 'preact'
import type { Catalog } from '../data/catalog'
import { Layout } from './Layout'

/** What the page is for, where the numbers come from, credits. */
export function AboutPage({ header, catalog }: { header: ComponentChildren; catalog: Catalog | null }) {
  return (
    <Layout header={header}>
      <article class="about-page">
        <h2>About</h2>
        <p>
          The Moon's phases repeat every 29.5 days, its closest approach to Earth (perigee) every 27.6 days. When a New
          or Full Moon falls near perigee it is a <em>supermoon</em>; near the farthest point (apogee), a{' '}
          <em>micromoon</em>. The two rhythms drift in and out of step every ~412 days. A third rhythm, the Moon
          crossing the plane of the Earth's orbit, decides when New and Full Moons are eclipses.
        </p>
        <p>
          <strong>Explore</strong> shows the New and Full Moons around any moment from 1850 to 2149 as a table and
          in charts: the distance and height of the Moon, its orbit seen from above, the beat of the two rhythms,
          the long view and the best alignments. <strong>Δ</strong> is the time from the New or Full Moon to the
          perigee or apogee: the closer to zero, the better the two rhythms line up.{' '}
          <a href="#learn">Learn: the astronomy</a> explains what is behind it.
        </p>
        <h3>Data and credits</h3>
        <p>
          {catalog ? (
            <>
              Computed with <a href="https://rhodesmill.org/skyfield/">Skyfield</a> from NASA's {catalog.ephemeris}{' '}
              ephemeris (data generated {catalog.generated.slice(0, 10)}), years 1850–2149.
            </>
          ) : (
            <>
              Computed with <a href="https://rhodesmill.org/skyfield/">Skyfield</a> from NASA's JPL DE440s ephemeris,
              years 1850–2149.
            </>
          )}{' '}
          Solar eclipses and the Moon's position between events from{' '}
          <a href="https://github.com/cosinekitty/astronomy">astronomy-engine</a> (Don Cross). Definitions after Fred
          Espenak's tables at <a href="https://astropixels.com/ephemeris/moon/fullperigee2001.html">astropixels.com</a>:
          supermoon = within 10 % of the perigee distance, micromoon = within 10 % of the apogee distance (of the
          perigee–apogee span of that orbit). Icons: <a href="https://heroicons.com/">Heroicons</a>.
        </p>
        <p>
          Moon Ephemerides {__APP_VERSION__} ·{' '}
          <a href="https://github.com/bzamecnik/moon-ephemerides">source code and documentation</a> · ideas and
          guidance Bohumír Zámečník, implementation Claude Code.
        </p>
      </article>
    </Layout>
  )
}
