# Validation against astropixels.com

Our catalog (skyfield 1.55, JPL DE440s) compared with Fred Espenak's tables
for 1901–2100, saved locally (not in this repo, they are copyrighted).
Raw output: [validation-report.txt](validation-report.txt); rerun with
`uv run moon-ephemerides validate`.

Differences are *ours − astropixels*, with our times rounded to the minute
like the tables.

## Supermoons and micromoons (2577 rows, 1901–2100)

- **Same set of events**: every row is found, no phase mismatch, and none of
  our syzygies with relative distance ≤ 0.1 or ≥ 0.9 is missing from the tables.
- Syzygy times: 0 min (71 %), ±1 min (29 %), one row 2 min: agreement to rounding.
- Distance: mean −0.4 km, max 8 km.
- Relative distance: within 0.001; this confirms the definition with the
  *nearest* perigee and apogee.
- Δ (apsis − syzygy): within 0.008 d (12 min), mostly ≤ 0.002 d.
- Lunar eclipse flags: 11 differ. Nine are January Full Moons with an eclipse
  that the tables don't mark, among them the total eclipses of 1953 Jan 29,
  2000 Jan 21 and 2019 Jan 21, which certainly happened, so this looks like a
  gap in the tables. The other two (2027 Jul 18, 2096 Jun 6) are very shallow
  penumbral eclipses, where the limit depends on the model of Earth's shadow.

## Perigees and apogees (3632 rows, 1901–2037)

The saved 2001–2100 page ends in 2037.

- Apogees: time within 3.6 min (σ 0.8 min), distance within 6 km.
- Perigees: time within 31 min (σ ~5 min), distance within 14 km.
- Apparent diameter: ours 0.01–0.02′ smaller throughout; we use the IAU mean
  lunar radius 1737.4 km, the tables a larger one (≈ 1738.1 km, the value used
  for eclipse predictions).

The perigee spread matches the stated accuracy of the truncated
perigee/apogee series in Meeus, *Astronomical Algorithms* ch. 50 (max error
31 min for perigee, 3 min for apogee), so this table was probably computed
with those series, and the DE440 values are the more accurate ones. The
apsides in the supermoon/micromoon tables agree with ours better (within
12 min), so those tables seem to use a more precise method.

## Parser notes

- A few rows have a stray `M` after the time (1929, 1938); the parser ignores it.
- Each page also has "Closest …" / "Ultimate …" summary tables repeating rows;
  only the decade tables (captioned "Greenwich Mean Time (GMT)") are read.
- The apsis date in a syzygy row has no year; it is resolved with Δ
  (e.g. New Moon 2005 Dec 31, perigee Jan 1 → 2006).
