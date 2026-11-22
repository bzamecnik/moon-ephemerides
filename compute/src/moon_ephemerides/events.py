"""Finding lunar events with skyfield and a JPL ephemeris.

All times are skyfield `Time` objects; distances are geocentric, centre to centre, in km.
"""

from dataclasses import dataclass
from pathlib import Path

import numpy as np
from skyfield import almanac, eclipselib
from skyfield.api import Loader
from skyfield.jpllib import SpiceKernel
from skyfield.searchlib import find_discrete, find_maxima, find_minima
from skyfield.timelib import Time, Timescale

DATA_DIR = Path(__file__).resolve().parents[2] / "data"
EPHEMERIS = "de440s.bsp"  # 1849-12-26 to 2150-01-22

MOON_RADIUS_KM = 1737.4  # IAU mean radius

PHASE_NAMES = ("new", "first_quarter", "full", "last_quarter")
LUNAR_ECLIPSE_NAMES = ("penumbral", "partial", "total")


def load_ephemeris(name: str = EPHEMERIS, data_dir: Path = DATA_DIR) -> tuple[Timescale, SpiceKernel]:
    """Loads (downloading on first use) the timescale and a JPL ephemeris kernel."""
    load = Loader(str(data_dir))
    return load.timescale(), load(name)


def ephemeris_range_tt(eph: SpiceKernel) -> tuple[float, float]:
    """The span covered by all segments of the kernel, as Julian dates (TDB, equal to TT within 2 ms)."""
    return max(s.spk_segment.start_jd for s in eph.segments), min(s.spk_segment.end_jd for s in eph.segments)


@dataclass(frozen=True)
class Events:
    t: Time
    kind: np.ndarray
    """integer code, meaning depends on the event type"""
    distance_km: np.ndarray


def earth_moon_distance(eph: SpiceKernel):
    """Geometric Earth-Moon distance (km) as a function of time, for skyfield's searches."""
    earth_to_moon = eph["moon"] - eph["earth"]

    def distance(t: Time) -> np.ndarray:
        return earth_to_moon.at(t).distance().km

    distance.step_days = 1.0  # extrema are ~14 days apart
    return distance


def apparent_diameter_arcmin(distance_km: np.ndarray) -> np.ndarray:
    return np.degrees(2 * np.arcsin(MOON_RADIUS_KM / distance_km)) * 60


def find_phases(eph: SpiceKernel, t0: Time, t1: Time) -> Events:
    """Moon phases; kind: 0 new, 1 first quarter, 2 full, 3 last quarter."""
    t, kind = find_discrete(t0, t1, almanac.moon_phases(eph))
    return Events(t, kind, earth_moon_distance(eph)(t))


def drop_repeats(tt: np.ndarray, kind: np.ndarray, min_gap_days: float = 1.0) -> np.ndarray:
    """Mask keeping the first of events of the same kind closer than `min_gap_days`
    (times sorted). skyfield's find_minima/maxima occasionally report an extremum
    twice, a second apart, where it falls on the edge of a search step."""
    keep = np.ones(len(tt), bool)
    last: dict[int, float] = {}
    for i, (t, k) in enumerate(zip(tt, kind)):
        if k in last and t - last[k] < min_gap_days:
            keep[i] = False
        else:
            last[k] = t
    return keep


def find_apsides(eph: SpiceKernel, t0: Time, t1: Time) -> Events:
    """Perigees and apogees; kind: 0 perigee, 1 apogee."""
    distance = earth_moon_distance(eph)
    t_min, d_min = find_minima(t0, t1, distance)
    t_max, d_max = find_maxima(t0, t1, distance)
    tt = np.concatenate([t_min.tt, t_max.tt])
    order = np.argsort(tt)
    kind = np.concatenate([np.zeros(len(t_min), int), np.ones(len(t_max), int)])[order]
    d = np.concatenate([d_min, d_max])[order]
    tt = tt[order]
    keep = drop_repeats(tt, kind)
    return Events(t0.ts.tt_jd(tt[keep]), kind[keep], d[keep])


def find_nodes(eph: SpiceKernel, t0: Time, t1: Time) -> Events:
    """Moon crossing the ecliptic; kind: 0 descending, 1 ascending node."""
    t, kind = find_discrete(t0, t1, almanac.moon_nodes(eph))
    return Events(t, kind, earth_moon_distance(eph)(t))


def find_lunar_eclipses(eph: SpiceKernel, t0: Time, t1: Time) -> Events:
    """Lunar eclipses (time of greatest eclipse); kind: 0 penumbral, 1 partial, 2 total."""
    t, kind, _details = eclipselib.lunar_eclipses(t0, t1, eph)
    return Events(t, kind, earth_moon_distance(eph)(t))
