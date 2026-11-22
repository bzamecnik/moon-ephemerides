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
