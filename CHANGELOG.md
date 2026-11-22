# Changelog

One version for the whole repository (the Python `compute/` package and the
`web/` app are released together). The JSON data format has its own number,
`meta.format`, changed only when the format breaks.

## 0.2.0 – 2026-11-22

Eclipses, the orbit seen from above, a learning page and new controls.

- **Eclipses:** solar eclipses in the catalog (astronomy-engine; 224 in
  2001–2100 as in NASA's canon) next to the lunar ones, with their kind
  (total, annular, partial, penumbral) in the table, the ranking and the
  charts (a violet ring). The *Show* menu can list only eclipses of chosen
  kinds. Eclipse seasons (the node line within 18.6° of the Sun) are shaded
  in the *Distance* view.
- **Orbit from above:** a new view looking down on the Earth, turning with
  the Earth–Sun line: the Moon's path two weeks back and ahead, the
  perigee–apogee line through the true perigees (▼) and apogees (▲), the node
  line with the crossings of the Earth's orbit plane (☊ / ☋) and the zones
  where eclipses are possible, the direction of the Sun through the Earth.
- **Distance:** the true distance curve instead of an approximation, and a
  panel with the Moon's height above the plane of the Earth's orbit, with the
  crossings and the New and Full Moons joined by lines.
- **Pages:** Explore, About (introduction, data sources and credits) and
  Learn, in a sidebar. **Learn** shows `docs/astronomy.md`: the causes of the
  three rhythms, the views explained, examples that open the app at their
  date; the views link to its sections.
- **Controls:** on wide screens the controls and the closest event sit in a
  sidebar and the views take the rest; compact icon buttons (Heroicons) with
  tooltips; a UTC | Local toggle; hover and focus states on all controls.
- ▶ Play by 6 hours, a day, a week, a month, a beat, or live (following the
  clock once a minute).
- Keyboard shortcuts: ← / → events (Shift: beats), Space / K play, N now,
  D date, 1–7 views, [ ] play step, ? the list of keys (in a pop-up).
- Clearer charts: the closest event with a pale yellow halo (like its row in
  the table), ordinary New and Full Moons darker than the lines; in the table
  a shorter Δ column with decimal points lined up.
- Fixed: Next event skipped the closest event when it was still ahead.

## 0.1.0 – 2026-11-22

The first release.

- **Catalog (Python):** New and Full Moons, quarters, perigees and apogees,
  nodes and lunar eclipses 1850–2149, computed with Skyfield from JPL DE440s;
  each New/Full Moon paired with its nearest perigee and apogee (Δ, relative
  distance, super-/micromoon by Espenak's definition). Validated against Fred
  Espenak's astropixels.com tables 1901–2100: the same 2577 super- and
  micromoons, times within a minute (`docs/validation.md`).
- **Web app:** all New and Full Moons around a chosen date and time (UTC or
  local), with super- and micromoons told apart, and the views
  - *Table*, with clickable dates,
  - *Distance* over time, with the perigee/apogee envelopes and the slow waves
    of the New and Full Moons,
  - *Beat of the rhythms* (Δ to the nearest perigee),
  - *Phase vs. distance*,
  - *Long term* (one event per half beat over decades or 300 years),
  - *Best alignments* per century.
- Navigation by event (← / →) and by beat (Shift, ⏪ / ⏩, ▶ Play); the date
  and view are kept in the URL.
- The astronomy behind it in `docs/astronomy.md`, including why the
  alignments creep and rush (evection).
