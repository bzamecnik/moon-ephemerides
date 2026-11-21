"""Parser of Fred Espenak's lunar tables from astropixels.com (saved HTML pages).

Used only to validate our own calculations. The pages are copyrighted
(all rights reserved), so they are not part of this repository; point the
parser at a local copy.

Supported pages (one century each), e.g. for 2001-2100:
- "Moon at Perigee and Apogee" (perigee2001.html)
- "Full Moon at Perigee (Full Supermoon)" (fullperigee2001.html)
- "New Moon at Perigee (New Supermoon)" (newperigee2001.html)
- "Full Moon at Apogee (Full Micromoon)" (fullapogee2001.html)
- "New Moon at Apogee (New Micromoon)" (newapogee2001.html)

All times are UT (the pages say GMT), rounded to the minute.
"""

import re
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from pathlib import Path

from bs4 import BeautifulSoup

MONTHS = {
    m: i for i, m in enumerate(["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], 1)
}

_DATE = r"([A-Z][a-z]{2}) (\d{2})\s+(\d{2}):(\d{2})"

_SYZYGY_LINE = re.compile(
    r"^\s*(?P<year>\d{4})?\s+"
    rf"{_DATE}\s?(?P<eclipse>[tpnTPAHMm])?\s+"  # a few rows have a stray M here
    r"(?P<distance>\d{6})\s?(?P<extreme>[mM])?\s+"
    r"(?P<diameter>\d+\.\d+)\s+"
    r"(?P<rel_distance>\d\.\d+)\s+"
    r"(?:(?P<brightness>\d\.\d+/\d\.\d+)\s+)?"
    rf"{_DATE}\s+"
    r"(?P<delta>-?\d+\.\d+)\s*$"
)

_APSIS = re.compile(rf"{_DATE}\s+(\d{{6}})\s?([mM])?\s+(\d+\.\d+)")


@dataclass(frozen=True)
class Syzygy:
    """A row of a supermoon/micromoon table."""

    time: datetime
    phase: str  # "new" or "full"
    apsis: str  # "perigee" or "apogee"
    eclipse: str  # "" or the code: t/p/n lunar, T/P/A/H solar
    distance_km: int
    extreme_of_year: bool
    diameter_arcmin: float
    relative_distance: float
    """as printed: 1.0 when the syzygy is exactly at the apsis named by the table"""
    apsis_time: datetime
    apsis_delta_days: float


@dataclass(frozen=True)
class Apsis:
    """A perigee or apogee from the perigee/apogee table."""

    time: datetime
    kind: str  # "perigee" or "apogee"
    distance_km: int
    extreme_of_year: bool
    diameter_arcmin: float


def _data_tables(html: str) -> list[str]:
    """Texts of the decade tables (each preceded by a "Greenwich Mean Time (GMT)" caption).

    The pages also contain summary tables ("Closest ...", "Ultimate ...") repeating
    some rows; those are skipped.
    """
    soup = BeautifulSoup(html, "html.parser")
    tables = []
    for pre in soup.find_all("pre"):
        text = pre.get_text()
        if "Year" not in text or "Diameter" not in text:
            continue
        caption = pre.find_previous(string=re.compile(r"\S"))
        if caption is not None and "Greenwich Mean Time (GMT)" in caption:
            tables.append(text)
    return tables


def _time(year: int, month: str, day: str, hour: str, minute: str) -> datetime:
    return datetime(year, MONTHS[month], int(day), int(hour), int(minute), tzinfo=UTC)


def parse_syzygy_tables(html: str) -> list[Syzygy]:
    rows = []
    for table in _data_tables(html):
        header = table.lstrip("\n").splitlines()[0]
        phase = "full" if "Full Moon" in header else "new"
        apsis = "perigee" if "Perigee" in header else "apogee"
        year = None
        for line in table.splitlines():
            m = _SYZYGY_LINE.match(line)
            if not m:
                continue
            if m["year"]:
                year = int(m["year"])
            g = m.groups()
            time = _time(year, *g[1:5])
            delta = float(m["delta"])
            # the apsis date has no year; take the one closest to time + delta
            approx = time + timedelta(days=delta)
            apsis_time = min(
                (
                    _time(y, *g[11:15])
                    for y in (approx.year - 1, approx.year, approx.year + 1)
                    if _valid(y, g[11], g[12])
                ),
                key=lambda t: abs(t - approx),
            )
            rows.append(
                Syzygy(
                    time=time,
                    phase=phase,
                    apsis=apsis,
                    eclipse=(m["eclipse"] or "").replace("M", "").replace("m", ""),
                    distance_km=int(m["distance"]),
                    extreme_of_year=bool(m["extreme"]),
                    diameter_arcmin=float(m["diameter"]),
                    relative_distance=float(m["rel_distance"]),
                    apsis_time=apsis_time,
                    apsis_delta_days=delta,
                )
            )
    return rows


def _valid(year: int, month: str, day: str) -> bool:
    try:
        datetime(year, MONTHS[month], int(day))
        return True
    except ValueError:  # Feb 29 in a common year
        return False


def parse_apsis_tables(html: str) -> list[Apsis]:
    rows = []
    for table in _data_tables(html):
        year = None
        for line in table.splitlines():
            m = re.match(r"^\s*(\d{4})\s", line)
            if m:
                year = int(m[1])
            if year is None:
                continue
            for a in _APSIS.finditer(line):
                distance = int(a[5])
                rows.append(
                    Apsis(
                        time=_time(year, *a.groups()[:4]),
                        # perigees are always below 371 000 km, apogees above 404 000 km
                        kind="perigee" if distance < 390_000 else "apogee",
                        distance_km=distance,
                        extreme_of_year=bool(a[6]),
                        diameter_arcmin=float(a[7]),
                    )
                )
    return sorted(rows, key=lambda r: r.time)


def load_syzygies(directory: Path) -> list[Syzygy]:
    """All supermoon/micromoon rows from the saved pages in `directory`."""
    rows = []
    for path in sorted(directory.glob("*Moon at *moon)_ * to *.html")):
        rows.extend(parse_syzygy_tables(path.read_text(encoding="utf-8", errors="replace")))
    return sorted(rows, key=lambda r: r.time)


def load_apsides(directory: Path) -> list[Apsis]:
    """All rows from the saved "Moon at Perigee and Apogee" pages in `directory`."""
    rows = []
    for path in sorted(directory.glob("Moon at Perigee and Apogee_ * to *.html")):
        rows.extend(parse_apsis_tables(path.read_text(encoding="utf-8", errors="replace")))
    return sorted(rows, key=lambda r: r.time)
