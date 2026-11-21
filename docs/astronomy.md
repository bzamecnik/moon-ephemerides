# The astronomy behind it

## Two rhythms

| Month | From … to the same again | Mean length (days) |
|---|---|---|
| synodic | New Moon (Sun–Earth–Moon alignment) | 29.530589 |
| anomalistic | perigee (closest point of the orbit) | 27.554550 |
| draconic | ascending node (Moon crossing the ecliptic) | 27.212221 |

A **syzygy** is a New or Full Moon (the Moon in line with Earth and Sun).
An **apsis** is a perigee or an apogee. The events lie on two "clocks" that
tick at different rates, so the time between a syzygy and the nearest apsis,
**Δ = t(apsis) − t(syzygy)**, drifts by about two days every month:

- half a synodic month (New → Full) is 14.765 d, half an anomalistic month
  (perigee → apogee) is 13.777 d, so Δ shifts by ≈ 0.99 d per half-month;
- the beat period, after which the pattern repeats, is
  1 / (1/27.5546 − 1/29.5306) ≈ **411.8 days**, the so-called *full moon cycle*;
  Espenak gives the related commensurability 14 synodic ≈ 15 anomalistic months (≈ 413.4 d).

When Δ ≈ 0 for one syzygy, the syzygies half a month before and after sit
symmetrically at Δ ≈ ±1.4 d from the opposite apsis. Example (Jan 2023):
Full Moon Jan 6, apogee +1.42 d → New Moon Jan 21, perigee +0.003 d → Full Moon
Feb 5, apogee −1.40 d. So "small Δ" and "symmetric neighbours" are one and
the same condition.

## Why the closest perigees come with good alignments

The Sun stretches the Moon's orbit most when the line of apsides (perigee–apogee
axis) points towards the Sun. The line of apsides turns once in 8.85 years, so
relative to the Sun it lines up every ≈ 411.8 days, the same beat as above.
At those times a New or Full Moon is near an apsis *and* the orbit is most
eccentric, so the perigee is especially close (and the apogee especially far).
Near perihelion (early January) the Sun's pull is stronger still, which is
why many of the extreme perigees fall in winter (e.g. 1912 Jan 4, 356 375 km;
2023 Jan 21, 356 568 km).

## Relative distance (Espenak's supermoon definition)

    relative distance = (D − D_perigee) / (D_apogee − D_perigee)

with the distances of the nearest perigee and apogee: 0 at perigee, 1 at
apogee. A **supermoon** has relative distance ≤ 0.1 (the astropixels tables
print 1 − this value for supermoons), a **micromoon** ≥ 0.9. Our pairing
reproduces Espenak's numbers to 0.001 (see `validation.md`).

## Nodes and eclipses

The Moon's orbit is tilted ~5.1° to the ecliptic; it crosses it at the
ascending and descending nodes. An eclipse happens only when a syzygy falls
near a node (eclipse seasons, every ~173 days). Combining the three clocks
(phase, distance, node) gives e.g. total solar eclipses vs annular ones
(Moon near perigee vs apogee).

## Ideas: a phase-phase picture and envelopes

**Phase-phase plot.** Put the position in the synodic month on one axis
(0 = New Moon, ½ = Full Moon) and the position in the anomalistic month on
the other (0 = perigee, ½ = apogee). Day by day the Moon traces diagonal lines
that slowly slide across the square with the 411.8-day beat; syzygies at an
apsis are the four points (0,0), (0,½), (½,0), (½,½). The anomalistic phase
can be defined without any model, by interpolating time between the
neighbouring perigee and apogee.

**Envelopes.** The extremes are not constant: perigee distance ranges over
~356 400–370 400 km, apogee over ~404 000–406 700 km, modulated mainly by the
angle between the Sun and the line of apsides and by the Earth–Sun distance.
An envelope (the curve through the extremes) gives limits, so that any event
can be placed between "as close as it gets at this time" and "as far": a
normalised score. Two ways:

1. empirical: the upper/lower hull of the apsis distances over time
   (local extrema of the extrema, smoothed or interpolated);
2. physical: fit the apsis distances to a few periodic terms (twice the
   Sun–apse angle, the Sun's anomaly), as in the perigee/apogee series of
   Meeus (Astronomical Algorithms, ch. 50); this explains the envelope instead
   of just tracing it.

The same works for Δ: the best Δ of each 411.8-day season varies, and its
envelope shows when the best alignments of a whole era happen.
