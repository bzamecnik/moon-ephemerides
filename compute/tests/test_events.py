"""Event finders checked against independent facts: mean month lengths (Meeus,
Astronomical Algorithms) and well-known individual events."""

import numpy as np
import pytest

from moon_ephemerides.events import (
    apparent_diameter_arcmin,
    drop_repeats,
    ephemeris_range_tt,
    find_apsides,
    find_lunar_eclipses,
    find_nodes,
    find_phases,
    find_solar_eclipses,
)


@pytest.fixture(scope="module")
def century(ts):
    return ts.utc(1950), ts.utc(2050)


def mean_period(t) -> float:
    """Slope of a line fitted through the event times: robust to the variation of single months."""
    return np.polyfit(np.arange(len(t)), t.tt, 1)[0]


def test_mean_synodic_month(eph, century):
    phases = find_phases(eph, *century)
    new = phases.t[phases.kind == 0]
    assert mean_period(new) == pytest.approx(29.530589, abs=1e-4)


def test_phases_cycle_in_order(eph, century):
    phases = find_phases(eph, *century)
    assert set(np.diff(phases.kind) % 4) == {1}


def test_mean_anomalistic_month(eph, century):
    aps = find_apsides(eph, *century)
    perigees = aps.t[aps.kind == 0]
    assert mean_period(perigees) == pytest.approx(27.554550, abs=5e-4)


def test_apsides_alternate(eph, century):
    aps = find_apsides(eph, *century)
    assert set(np.diff(aps.kind) ** 2) == {1}


def test_apsis_distances_within_known_limits(eph, century):
    # Espenak & Meeus, Five Millennium Catalog of Solar Eclipses (-1999..3000)
    aps = find_apsides(eph, *century)
    perigee_d = aps.distance_km[aps.kind == 0]
    apogee_d = aps.distance_km[aps.kind == 1]
    assert 356_355 <= perigee_d.min() and perigee_d.max() <= 370_399
    assert 404_042 <= apogee_d.min() and apogee_d.max() <= 406_725


def test_mean_draconic_month(eph, century):
    nodes = find_nodes(eph, *century)
    ascending = nodes.t[nodes.kind == 1]
    assert mean_period(ascending) == pytest.approx(27.212221, abs=5e-4)


def test_new_moon_at_perigee_2023_jan_21(eph, ts):
    # a famous close perigee syzygy: New Moon 20:53 UT, perigee 20:58 UT, 356 571 km
    t0, t1 = ts.utc(2023, 1, 20), ts.utc(2023, 1, 23)
    phases = find_phases(eph, t0, t1)
    new = phases.t[phases.kind == 0]
    assert len(new) == 1
    assert abs(new[0].tt - ts.utc(2023, 1, 21, 20, 53).tt) * 24 * 60 < 1

    aps = find_apsides(eph, t0, t1)
    assert aps.kind.tolist() == [0]
    assert abs(aps.t[0].tt - ts.utc(2023, 1, 21, 20, 58).tt) * 24 * 60 < 2
    assert aps.distance_km[0] == pytest.approx(356_568, abs=5)


def test_total_lunar_eclipse_2022_nov_08(eph, ts):
    ecl = find_lunar_eclipses(eph, ts.utc(2022, 11, 1), ts.utc(2022, 11, 15))
    assert ecl.kind.tolist() == [2]
    # greatest eclipse 10:59 UT (NASA)
    assert abs(ecl.t[0].tt - ts.utc(2022, 11, 8, 10, 59).tt) * 24 * 60 < 2


@pytest.mark.parametrize(
    ("date", "greatest", "kind"),
    [
        # greatest eclipse (NASA, Espenak); the hybrid eclipse of 2023-04-20 counts as total
        ((2017, 8, 21), (2017, 8, 21, 18, 25), 2),
        ((2024, 4, 8), (2024, 4, 8, 18, 17), 2),
        ((2023, 10, 14), (2023, 10, 14, 17, 59), 1),
        ((2023, 4, 20), (2023, 4, 20, 4, 17), 2),
        ((2022, 10, 25), (2022, 10, 25, 11, 0), 0),
    ],
)
def test_solar_eclipses(eph, ts, date, greatest, kind):
    y, m, d = date
    ecl = find_solar_eclipses(eph, ts.utc(y, m, d - 3), ts.utc(y, m, d + 3))
    assert ecl.kind.tolist() == [kind]
    assert abs(ecl.t[0].tt - ts.utc(*greatest).tt) * 24 * 60 < 2


def test_solar_eclipses_of_the_21st_century(eph, ts):
    # NASA's Five Millennium Canon: 224 solar eclipses in 2001-2100
    assert len(find_solar_eclipses(eph, ts.utc(2001, 1, 1), ts.utc(2101, 1, 1)).kind) == 224


def test_apparent_diameter():
    # mean distance 384 400 km gives about 31.08'
    assert apparent_diameter_arcmin(np.array([384_400.0]))[0] == pytest.approx(31.08, abs=0.01)


def test_ephemeris_range(eph, ts):
    first, last = ephemeris_range_tt(eph)
    assert ts.tdb_jd(first).tdb_strftime("%Y-%m-%d %H:%M") == "1849-12-26 00:00"
    assert ts.tdb_jd(last).tdb_strftime("%Y-%m-%d %H:%M") == "2150-01-22 00:00"


def test_apsides_alternate_over_the_whole_ephemeris(eph, ts):
    # find_minima/maxima can report one extremum twice, a second apart, where it
    # falls on the edge of a search step; this happened 3 times in 1850-2149
    first, last = ephemeris_range_tt(eph)
    aps = find_apsides(eph, ts.tt_jd(first + 1), ts.tt_jd(last - 1))
    assert set(np.diff(aps.kind) ** 2) == {1}
    assert np.diff(aps.t.tt).min() > 10


def test_drop_repeats_keeps_the_first_of_a_close_pair_of_the_same_kind():
    tt = np.array([0.0, 13.8, 13.8 + 1e-5, 27.5, 27.6])
    kind = np.array([0, 1, 1, 0, 1])
    assert drop_repeats(tt, kind).tolist() == [True, True, False, True, True]
