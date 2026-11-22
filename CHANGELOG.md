# Changelog

One version for the whole repository (the Python `compute/` package and the
`web/` app are released together). The JSON data format has its own number,
`meta.format`, changed only when the format breaks.

## Unreleased

- **Solar eclipses** in the catalog (astronomy-engine; 224 in 2001–2100 as in
  NASA's canon), and all eclipses shown in the table, the ranking and the
  charts (a violet ring), with the kind (total, annular, partial, penumbral).
- **Orbit from above:** a new view looking down on the Earth with the Sun
  fixed to the right: the Moon's path over four weeks, the perigee–apogee line
  turning once per beat and the node line once per eclipse year.
- **Distance:** the true distance curve (astronomy-engine) instead of an
  approximation, and a panel with the Moon's height above the plane of the
  Earth's orbit, showing when eclipses are possible.
- ▶ Play steps by beats or by 6 hours.
- **Learn:** `docs/astronomy.md` as a page in the app (`#learn`), linked from
  the charts.
- **Controls:** on wide screens the controls and the closest event sit in a
  sidebar and the views take the rest; compact icon buttons (Heroicons) with
  tooltips; a UTC | Local toggle; a *Show* pop-up replacing the checkboxes,
  which can also list only eclipses of chosen kinds; hover and focus states
  on all controls.
- **Orbit from above:** the coming days up to the next New or Full Moon
  (dashed), the past fading with age, the direction of the Sun drawn through
  the Earth, the perigee–apogee line in the supermoon/micromoon colours, dots
  where the Moon crosses the Earth's orbit plane, the Moon at the selected
  moment ringed in yellow.
- The same symbols for the same things: ▼ perigee and ▲ apogee, ☊ / ☋ where
  the Moon crosses the plane of the Earth's orbit going north / south, on the
  lines, along the Moon's path and in the legends; the height panel of
  *Distance* marks the crossings and joins the New and the Full Moons by lines
  as the distance panel does.
- The closest event has a pale yellow halo in the charts (like its row in the
  table); other New and Full Moons are a darker grey than the lines.
- Fixed: Next event skipped the closest event when it was still ahead.
- **Pages:** Explore, About (the introduction, data sources and credits) and
  Learn, in the sidebar; Learn lists its sections there.
- ▶ Play by 6 hours, a day, a week, a month, a beat, or live (following the
  clock once a minute).
- Keyboard shortcuts: Space / K play, N now, D date, 1–7 views, [ ] play step,
  ? the list of keys.

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
