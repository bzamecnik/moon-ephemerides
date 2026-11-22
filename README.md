# Moon Ephemerides

How the Moon's phases and its distance from Earth play together.

**Live:** <https://bzamecnik.github.io/moon-ephemerides/> · [Changelog](./CHANGELOG.md)

The Moon has two rhythms that almost, but not quite, keep step: New Moon to
New Moon takes 29.53 days, closest approach (perigee) to closest approach takes
27.55 days. Every ~412 days a New or Full Moon falls almost exactly on a perigee
or an apogee – a supermoon or a micromoon – and in between the two rhythms
drift apart again. This project computes these events from open data (NASA JPL
ephemerides, via [skyfield](https://rhodesmill.org/skyfield/)) and shows
them in a web page: all supermoons and micromoons (New and Full) in one table
around any date, with the time Δ between each New/Full Moon and its perigee or
apogee, eclipses, charts of the beat of the two rhythms, the orbit seen from
above and the best alignments over centuries, and a page explaining the
astronomy behind it (rendered from [docs/astronomy.md](docs/astronomy.md)).

Inspired by Fred Espenak's tables at [astropixels.com](https://astropixels.com/ephemeris/moon/fullperigee2001.html),
against which the calculations are checked (see [docs/validation.md](docs/validation.md)).

## Layout

- `compute/` – Python package `moon_ephemerides`:
  - `events.py` – phases, perigees/apogees, nodes, lunar eclipses (skyfield + DE440s),
    solar eclipses (astronomy-engine)
  - `pairing.py` – each New/Full Moon with its nearest perigee and apogee (Δ, relative distance)
  - `catalog.py` – everything together for a time span
  - `export.py` – columnar JSON for the web app
  - `astropixels.py`, `validate.py` – parser of the astropixels tables and the comparison
- `docs/` – [plan](docs/plan.md), [astronomy notes](docs/astronomy.md), [validation](docs/validation.md)
- `web/` – the web app (Preact, TypeScript, Vite):
  - `public/data/lunar-events.json` – the exported catalog (generated, `npm run data`)
  - `src/data/catalog.ts` – decoding the JSON
  - `src/events.ts` – supermoon/micromoon classification, eclipse names
  - `src/orbit.ts` – the Moon's place in the frame of the Sun (astronomy-engine), mean perigee and node
  - `src/timeline.ts`, `src/format.ts` – navigation around a date, formatting
  - `src/playback.ts`, `src/shortcuts.ts`, `src/filters.ts` – ▶ Play steps, keyboard shortcuts, the Show filter
  - `src/beat.ts`, `src/phase.ts`, `src/longterm.ts`, `src/ranking.ts` – data for the charts and the ranking
  - `src/charts/` – SVG charts (distance and height, orbit from above, beat, phase vs. distance, long term), scales
  - `src/learn.ts` – the learning page from `docs/astronomy.md` (marked)
  - `src/components/` – the page: controls, tabs, table, ranking, learning page, icons

## Usage

The web app:

```sh
cd web
npm install
npm run dev          # dev server
npm test -- --run    # tests
npm run build        # type-check + production build into dist/
npm run data         # regenerate public/data/lunar-events.json (needs uv and compute/)
```

A date and view can be linked directly: `…/#date=2023-01-21&view=beat`
(views: `table`, `distance`, `orbit`, `beat`, `phase`, `longterm`, `ranking`),
the about page as `…/#about`, the learning page as `…/#learn`. ▶ Play steps by 6 hours, a day, a week, a
month, a beat, or follows the clock (live). Keys: ← / → previous / next event
(Shift: one beat), Space play, [ ] play step, N now, D date, 1–7 views, ? the
list of keys. Pushes to `main` are
deployed to GitHub Pages (`.github/workflows/pages.yml`).

The computation:

```sh
cd compute
uv sync
uv run pytest
uv run moon-ephemerides export --out lunar-events.json
uv run moon-ephemerides validate --astropixels path/to/saved/astropixels/pages
```

The JPL kernel `de440s.bsp` (32 MB, years 1850–2149) is downloaded to
`compute/data/` on first use.

## License

[MIT License](./LICENSE).

### Credits

- Ideas and guidance: Bohumír Zámečník
- Implementation: Claude Code (Opus 5.5)
- Ephemeris data: NASA JPL (public domain)
- [astronomy-engine](https://github.com/cosinekitty/astronomy) by Don Cross (MIT): solar eclipses, positions between events
- [marked](https://marked.js.org/) (MIT): the learning page
- [Heroicons](https://heroicons.com/) by Tailwind Labs (MIT): icons
- The astropixels.com tables are © Fred Espenak and are not included.
