import os
from collections import Counter
from datetime import UTC, datetime
from itertools import pairwise
from pathlib import Path

import pytest

from moon_ephemerides.astropixels import load_apsides, load_syzygies, parse_apsis_tables, parse_syzygy_tables

# Small hand-made tables in the layout of the astropixels pages.
FULL_APOGEE = """
<h3>Full Moon at Apogee (Full Micromoon): 2021 to 2030</h3>
<p>Greenwich Mean Time (GMT)</p>
<div class="pbox1"><pre>
 Year      Full Moon      Distance  Diameter  Relative   Relative          Apogee        ΔApogee
                            (km)    (arc-min) Distance   Brightness                       (days)


 2022    Dec 08  04:08     405000     29.50    0.970    0.780/0.900     Dec 12  01:00     3.870

 2023    Jan 06  23:08     405789     29.45    0.986    0.779/0.897     Jan 08  09:19     1.424
         Feb 05  18:29     405830 M   29.44    0.987    0.779/0.897     Feb 04  08:55    -1.398
         Mar 07  12:40 n   405100     29.50    0.970    0.780/0.900     Feb 28  12:40    -7.000
</pre></div>
<h3>Ultimate Full Moon Apogees</h3>
<div class="pbox1"><pre>
 Year      Full Moon      Distance  Diameter  Relative   Relative          Apogee        ΔApogee
                            (km)    (arc-min) Distance   Brightness                       (days)

 2023    Feb 05  18:29     405830 M   29.44    0.987    0.779/0.897     Feb 04  08:55    -1.398
</pre></div>
"""

NEW_PERIGEE = """
<p>Greenwich Mean Time (GMT)</p>
<div class="pbox1"><pre>
 Year      New Moon       Distance  Diameter  Relative      Perigee      ΔPerigee
                            (km)    (arc-min) Distance                    (days)

 2005    Dec 31  03:12     364397     32.79    0.939     Jan 01  22:50     1.818

 2006    Jan 29  14:15 T   358302     33.35    0.989     Jan 28  07:47    -1.270
</pre></div>
"""

APSIDES = """
<p>Greenwich Mean Time (GMT)</p>
<div class="pbox1"><pre>
    Year         Perigee      Distance   Diameter          Apogee       Distance  Diameter
                                (km)     (arc-min)                        (km)    (arc-min)

    2002     Dec 02  08:53     362294     32.98        Dec 14  03:57     404912     29.51
             Dec 30  01:06     367904     32.48

    2003                                               Jan 11  00:43     404343     29.55
             Jan 23  22:43     369912 M   32.30        Feb 07  21:58     404551 m   29.54
</pre></div>
"""


def test_syzygy_rows_and_columns():
    rows = parse_syzygy_tables(FULL_APOGEE)
    assert len(rows) == 4  # the summary table is skipped
    r = rows[2]
    assert r.time == datetime(2023, 2, 5, 18, 29, tzinfo=UTC)
    assert (r.phase, r.apsis) == ("full", "apogee")
    assert r.distance_km == 405830
    assert r.extreme_of_year
    assert r.diameter_arcmin == 29.44
    assert r.relative_distance == 0.987
    assert r.apsis_time == datetime(2023, 2, 4, 8, 55, tzinfo=UTC)
    assert r.apsis_delta_days == -1.398
    assert rows[3].eclipse == "n"
    assert [r.time.year for r in rows] == [2022, 2023, 2023, 2023]


def test_apsis_in_adjacent_year():
    rows = parse_syzygy_tables(NEW_PERIGEE)
    assert [(r.phase, r.apsis) for r in rows] == [("new", "perigee")] * 2
    assert rows[0].apsis_time == datetime(2006, 1, 1, 22, 50, tzinfo=UTC)
    assert rows[1].eclipse == "T"
    assert not rows[1].extreme_of_year


def test_apsis_table():
    rows = parse_apsis_tables(APSIDES)
    assert [(r.time.strftime("%Y-%m-%d"), r.kind) for r in rows] == [
        ("2002-12-02", "perigee"),
        ("2002-12-14", "apogee"),
        ("2002-12-30", "perigee"),
        ("2003-01-11", "apogee"),
        ("2003-01-23", "perigee"),
        ("2003-02-07", "apogee"),
    ]
    assert rows[4].extreme_of_year and rows[5].extreme_of_year
    assert rows[4].distance_km == 369912
    assert rows[5].diameter_arcmin == 29.54


ASTROPIXELS_DIR = Path(
    os.environ.get(
        "ASTROPIXELS_DIR",
        Path(__file__).resolve().parents[3] / "moon-earthquake-experiments/data/moon/astropixels.com-ephemeris",
    )
)
needs_pages = pytest.mark.skipif(not ASTROPIXELS_DIR.is_dir(), reason="saved astropixels pages not available")


@needs_pages
def test_real_pages_parse_completely():
    syzygies = load_syzygies(ASTROPIXELS_DIR)
    kinds = {(r.phase, r.apsis) for r in syzygies}
    assert kinds == {("new", "perigee"), ("full", "perigee"), ("new", "apogee"), ("full", "apogee")}
    assert min(r.time for r in syzygies).year == 1901
    assert max(r.time for r in syzygies).year == 2100
    # no duplicates from the summary tables
    assert len({(r.time, r.apsis) for r in syzygies}) == len(syzygies)
    # Δ printed in the table agrees with the parsed dates (to rounding of minutes)
    for r in syzygies:
        assert abs((r.apsis_time - r.time).total_seconds() / 86400 - r.apsis_delta_days) < 0.002, r

    apsides = load_apsides(ASTROPIXELS_DIR)
    # each year has 13-14 anomalistic months, each with one perigee and one apogee
    # (the saved 2001-2100 page may be truncated, so don't check the total)
    per_year = Counter(a.time.year for a in apsides)
    assert min(per_year) == 1901
    assert all(25 <= n <= 28 for n in per_year.values()), per_year
    assert all(a.kind != b.kind for a, b in pairwise(apsides))
