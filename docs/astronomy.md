# The astronomy behind it

The Moon has several rhythms that run side by side: its phases, its distance
from the Earth and its height above the plane of the Earth's orbit. This page
explains how they fit together, why supermoons, micromoons and eclipses come
in seasons, and what the views of the app show. The numbers come from the
catalog computed for 1850–2149 unless said otherwise.

## Three rhythms

**Phases.** The Sun always lights one half of the Moon. From the Earth we see
that lit half at an angle that depends on where the Moon stands relative to
the Sun. When the Moon is between the Earth and the Sun, its lit side faces
away from us: New Moon. A quarter of a round later we see half of the lit
side (first quarter), opposite the Sun all of it (Full Moon), then half again
(last quarter). From New Moon to New Moon takes a **synodic month**, 29.53
days, two days longer than one turn round the Earth against the stars (27.32
days): meanwhile the Earth has moved on along its orbit, so the Moon has to go
a bit farther to line up with the Sun again.

**Distance.** The Moon's orbit is not a circle but close to an ellipse, with
the Earth off its centre. So the Moon's distance swings, between about
356 000 and 407 000 km: closest at **perigee**, farthest at **apogee**. From
perigee to perigee takes an **anomalistic month**, 27.55 days; the ellipse
itself slowly turns forwards, so it is a little longer than a turn against
the stars.

**Height.** The Moon's orbit is tilted by about 5.1° to the plane of the
Earth's orbit round the Sun (the *ecliptic*). The two planes cross along a
line through the Earth, the **line of nodes**. Twice a month the Moon crosses
the plane, going north at the *ascending node* (☊) and south at the
*descending node* (☋); in between it is up to 5.1° north or south. From one
ascending node to the next takes a **draconic month**, 27.21 days: the node
line slowly turns backwards, against the Moon, so it is a little shorter than
a turn against the stars.

| Month | From … to the same again | Mean length (days) |
|---|---|---|
| synodic | New Moon (Sun–Earth–Moon alignment) | 29.530589 |
| anomalistic | perigee (closest point of the orbit) | 27.554550 |
| draconic | ascending node (Moon crossing the ecliptic) | 27.212221 |

The phases and the distance together make supermoons and micromoons; the
phases and the height make eclipses ([Nodes and eclipses](#learn-nodes-and-eclipses)
below).

A **syzygy** is a New or Full Moon (the Moon in line with Earth and Sun).
An **apsis** is a perigee or an apogee. The two kinds of events lie on two
"clocks" that tick at different rates, so the time between a syzygy and the
nearest apsis, **Δ = t(apsis) − t(syzygy)**, drifts by about two days every
month:

- half a synodic month (New → Full) is 14.765 d, half an anomalistic month
  (perigee → apogee) is 13.777 d, so Δ shifts by ≈ 0.99 d per half-month;
- the beat period, after which the pattern repeats, is
  1 / (1/27.5546 − 1/29.5306) ≈ **411.8 days**, the so-called *full moon cycle*;
  Espenak gives the related commensurability 14 synodic ≈ 15 anomalistic months (≈ 413.4 d).

When Δ ≈ 0 for one syzygy, the syzygies half a month before and after sit
symmetrically at Δ ≈ ±1.4 d from the opposite apsis. Example (Jan 2023):
[Full Moon Jan 6](https://bzamecnik.github.io/moon-ephemerides/#date=2023-01-06T23:07&view=table), apogee +1.42 d →
[New Moon Jan 21](https://bzamecnik.github.io/moon-ephemerides/#date=2023-01-21T20:53&view=table), perigee +0.003 d →
[Full Moon Feb 5](https://bzamecnik.github.io/moon-ephemerides/#date=2023-02-05T18:28&view=table), apogee −1.40 d. So "small
Δ" and "symmetric neighbours" are one and the same condition.

The drift is not uniform; see "Why the alignments wobble" below.

## Relative distance (Espenak's supermoon definition)

    relative distance = (D − D_perigee) / (D_apogee − D_perigee)

with the distances of the nearest perigee and apogee: 0 at perigee, 1 at
apogee. A **supermoon** has relative distance ≤ 0.1 (the astropixels tables
print 1 − this value for supermoons), a **micromoon** ≥ 0.9. Our pairing
reproduces Espenak's numbers to 0.001 (see [the validation](./validation.md)).

## Looking from above: turning with the Earth–Sun line

The *Orbit from above* view looks down on the Earth from far above its north
pole. The picture is centred on the Earth and turns once a year, so that the
line from the Earth to the Sun stays fixed, pointing to the right. (It is not
the Sun's own frame: seen from the Sun, the Earth would go round it.) In this
turning frame:

- **the phases stay put**: New Moon is on the Sun's side, Full Moon opposite,
  first and last quarter at right angles. The Moon goes round once per
  synodic month (29.53 days), its lit half always facing the Sun;
- **the perigee and apogee directions** turn *backwards* once per
  **411.8 days, the beat**. On average they lie on one line through the Earth,
  the *line of apsides*. Seen from the stars it turns forwards once in 8.85
  years, but the Sun goes round once a year, much faster, so relative to the
  Sun it falls behind: 1 / (1/365.24 − 1/3231.5) = 411.8 days. This is the
  same number as 1 / (1/27.5546 − 1/29.5306): both say how long it takes the
  phases to go once round the distance cycle;
- **the line of nodes** (where the orbit crosses the plane of the Earth's
  orbit) turns backwards once per **eclipse year, 346.6 days**: seen from the
  stars it turns backwards once in 18.6 years, the Sun forwards once a year,
  1 / (1/365.24 + 1/6798.4) = 346.6 days. Likewise 1 / (1/27.2122 − 1/29.5306).

So the three rhythms of the Moon become one round trip and two slowly turning
lines. When the perigee–apogee line points at the Sun (twice per beat), New
and Full Moons fall near perigee and apogee: the season of supermoons and
micromoons, and of the strongest evection (the orbit is stretched most, see
"the inchworm" below). When the node line points at the Sun (twice per
eclipse year, every 173.3 days), New and Full Moons happen close to the plane:
an [eclipse season](https://bzamecnik.github.io/moon-ephemerides/#date=2017-08-19T00:00&view=orbit).

The real perigee and apogee don't keep to the average line. The view draws
the line through them: each half points at the last real perigee (▼) or
apogee (▲) and turns evenly to the next, so the Moon's path meets it at each
mark. The perigee swings around the average direction (Meeus, *Astronomical
Algorithms*, ch. 47) because of evection, the apogee much less, so the two
halves form a bent line. In the catalog (1850–2149) the real perigee is within
5° of the average when the line points at the Sun, and up to 25° off when it
is 50–80° from the Sun; the apogee is always within 6°. So the perigee and
apogee line up best just in the season of supermoons and micromoons. Playing
the view by days, the perigee seems pulled towards the Sun line from both
sides, and snaps across quickly when the line is near right angles to it.

The node line is the average one; the real node is within ± 2° of it. The
shaded zones around it, ± 17°, are where the Moon is within 1.5° of the plane,
close enough for an eclipse (5.1° × sin 17° ≈ 1.5°). The oval of the orbit is
drawn four times more stretched than it is: at true scale (eccentricity 0.055,
distance 356 000 to 407 000 km) it looks like a circle.

## Why the alignments wobble (the "inchworm")

Stepping or playing by beats, the events don't drift smoothly: they creep,
then rush, then creep again. The cause is the Sun's tidal pull on the Moon's
orbit, mainly the perturbation called **evection** (the largest solar
perturbation, known since Ptolemy). It periodically changes the orbit's
eccentricity and swings the line of apsides back and forth around its mean
forward motion (the apsidal precession, one turn in 8.85 years).

- When the line of apsides points at the Sun (a New or Full Moon near
  perigee or apogee), the perigee runs forward fast, so perigee-to-perigee
  takes long, close to the 29.5-day synodic month: the phases slip past the
  perigee slowly, about a day per month.
- When the line is at right angles to the Sun (perigee near a quarter Moon),
  the perigee even moves backward, perigee-to-perigee is short and the phases
  rush past it by about 3.7 days per month.

From the catalog (1850–2149), perigee-to-perigee by the angle between the
Sun and the line of apsides (0° = perigee at New or Full Moon, 90° = at a
quarter):

| angle | 0° | 15° | 30° | 45° | 60° | 75° | 90° |
|---|---|---|---|---|---|---|---|
| mean (days) | 28.45 | 28.32 | 27.84 | 26.93 | 26.14 | 25.90 | 25.82 |

(All of them range from 24.64 to 28.56 days, with a mean of 27.5545 days.)
Real perigees are up to ± 1.9 days off a perfectly regular clock. New Moons
are only up to ± 14 hours off theirs (from the elliptical orbits of the Moon
and the Earth), so most of the wobble comes from the perigee.

The line of apsides points at the Sun twice per beat, so the creep–rush cycle
is half a beat long (~206 days). That is why the beat chart is a sawtooth with
flat stretches at the alignments, and why supermoons and micromoons come in
runs. Stepping by one beat lands on the same phase 14 synodic months
(413.4 days) later, 1.65 days more than a beat, so successive steps slowly
move through the creep–rush cycle and the animation alternates between slow
and fast. The Sun's pull is stronger in January (perihelion), which
modulates all this over the year and over the 8.85-year turn of the line of
apsides.

## Why the closest perigees come with good alignments

The Sun stretches the Moon's orbit most when the line of apsides (perigee–apogee
axis) points towards the Sun. The line of apsides turns once in 8.85 years, so
relative to the Sun it lines up every ≈ 411.8 days, the same beat as above.
At those times a New or Full Moon is near an apsis *and* the orbit is most
eccentric, so the perigee is especially close (and the apogee especially far).
Near perihelion (early January) the Sun's pull is stronger still, which is
why many of the extreme perigees fall in winter (e.g. [1912 Jan 4](https://bzamecnik.github.io/moon-ephemerides/#date=1912-01-04T13:34&view=distance),
356 375 km; [2023 Jan 21](https://bzamecnik.github.io/moon-ephemerides/#date=2023-01-21T20:57&view=distance), 356 568 km).

## The long view: one event per half beat

Twice per beat (every ≈ 206 days) the line of apsides points at the Sun,
alternately with the perigee on the Sun's side (New Moon at perigee, Full Moon
at apogee) and on the far side (Full Moon at perigee, New Moon at apogee).
The *Long term* view keeps one event of each such stretch:

- **the best-aligned New or Full Moon**: the one nearest in time to its
  perigee or apogee. |Δ| to the nearer apsis falls by about a day per New/Full
  Moon towards an alignment and rises after it, so this is a local minimum
  over ± 3 neighbours. It is always a super- or micromoon, within ± 0.34 days
  of the apsis (1850–2149); supermoons win more often, as the distance cycle
  drifts slowest near perigee.
- **the closest supermoon and the farthest micromoon**: closer (farther) than
  the same phase a month before and after.

Over decades Δ of the best-aligned events forms a sawtooth, one for New Moons
and one for Full Moons: it drifts by about −0.05 days (an hour) per beat,
from about +0.4 to −0.4 days, then the next stretch takes over and it jumps
back. So each phase gets a near-perfect alignment every 18–20 years ([Full Moon
2012-05-06](https://bzamecnik.github.io/moon-ephemerides/#date=2012-05-06T03:35&view=longterm), [New Moon 2023-01-21](https://bzamecnik.github.io/moon-ephemerides/#date=2023-01-21T20:53&view=longterm)), and New and Full take turns. The pattern
repeats after 251 synodic ≈ 269 anomalistic months (20.29 years, they differ
by only 0.01 day); the saros (223 ≈ 239 months, 18.03 years) is a worse fit
(0.2 day). In the catalog Δ of the best alignments 20.29 years apart differs
by 0.13 days on average, 18.03 years apart by 0.18 days.

The distances show the season: the closest supermoons average 356 760 km in
January (Earth near perihelion, see above) but 357 300 km in July; the
farthest micromoons barely change (406 200–406 330 km). The date of an
alignment moves through the year by ≈ 46.5 days per beat (411.8 − 365.25),
a full year in 8.85 years, so the closest supermoons swing in and out with
that period.

## The phase-vs-distance picture

Put the position in the synodic month on one axis
(0 = New Moon, ½ = Full Moon) and the position in the anomalistic month on
the other (0 = perigee, ½ = apogee). Day by day the Moon traces diagonal lines
that slowly slide across the square with the 411.8-day beat; syzygies at an
apsis are the four points (0,0), (0,½), (½,0), (½,½). The anomalistic phase
can be defined without any model, by interpolating time between the
neighbouring perigee and apogee.

The *Phase vs. distance* view draws this square, with the New and Full Moons
as marks; the phases between events are interpolated linearly in time (crude,
but exact at the events).

## Nodes and eclipses

The Moon's orbit is tilted about 5.1° to the plane of the Earth's orbit (the
ecliptic), so the Moon is usually a little above or below the line from the
Earth to the Sun, and New and Full Moons pass without an eclipse. It crosses
the plane twice a month, at the ascending node (going north) and the
descending node. A New Moon or a Full Moon that happens near a node is an
eclipse: the Moon covers the Sun (solar eclipse, at New Moon) or the Earth's
shadow covers the Moon (lunar eclipse, at Full Moon).

That happens only when the node line points close to the Sun: in an
**eclipse season**, about five weeks twice a year (every 173.3 days). In the
catalog every eclipse came with the node line within 18.6° of the Sun line,
and no New or Full Moon missed one when it was closer than 16.6°. A season is
longer than a month, so each brings at least one solar eclipse, often a lunar
one two weeks before or after. The *Distance* view shades the seasons, e.g.
[August 2017](https://bzamecnik.github.io/moon-ephemerides/#date=2017-08-21T18:30&view=distance) with the total solar eclipse
across the USA, or [February 2027](https://bzamecnik.github.io/moon-ephemerides/#date=2027-02-06T15:56&view=distance) with an
annular eclipse at a New Micromoon and a penumbral lunar one two weeks later.

From the catalog (1850–2149, the Moon's height from astronomy-engine): every
eclipse happened with the Moon within 1.6° of the plane, every New or Full
Moon without one was farther than 1.4°. In between it depends on the
distances. Total lunar eclipses need less than 0.5°, total and annular solar
eclipses less than 1.0°.

The distance decides between a total and an annular solar eclipse: near
perigee the Moon looks big enough to cover the whole Sun, near apogee a
bright ring stays around it. In 1850–2149 all 218 total solar eclipses (like [2024 Apr 8](https://bzamecnik.github.io/moon-ephemerides/#date=2024-04-08T18:20&view=orbit))
happened with the Moon closer than 381 440 km (151 of them were New
Supermoons, none was a micromoon). All 220 annular ones happened farther
than 372 750 km (89 were New Micromoons, none was a supermoon). In between,
the Earth–Sun distance decides, as it changes the size of the Sun.

Solar eclipses come from astronomy-engine (Don Cross), which classifies an
eclipse by its greatest point: a hybrid eclipse (total in part of its path,
annular elsewhere) counts as total or annular. Its count for 2001–2100, 224,
matches NASA's *Five Millennium Canon*. Lunar eclipses come from skyfield.
