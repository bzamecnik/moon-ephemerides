"""The catalog of lunar events: phases, apsides, nodes, eclipses, and the
pairing of each New/Full Moon with the nearest perigee and apogee."""

from dataclasses import dataclass

import numpy as np
from skyfield.jpllib import SpiceKernel
from skyfield.timelib import Time

from .events import (
    Events,
    apparent_diameter_arcmin,
    ephemeris_range_tt,
    find_apsides,
    find_lunar_eclipses,
    find_nodes,
    find_phases,
)
from .pairing import Pairing, pair_syzygies_with_apsides

# Espenak's definition: a syzygy within 90 % of the perigee-apogee span from the apsis
SUPERMOON_LIMIT = 0.1  # relative distance <= 0.1
MICROMOON_LIMIT = 0.9  # relative distance >= 0.9


@dataclass(frozen=True)
class Catalog:
    phases: Events
    apsides: Events
    nodes: Events
    lunar_eclipses: Events
    syzygies: Events
    """New (kind 0) and Full (kind 2) Moons"""
    pairing: Pairing
    """for each syzygy"""
    lunar_eclipse_kind: np.ndarray
    """for each syzygy: -1 none, 0 penumbral, 1 partial, 2 total"""

    @property
    def is_supermoon(self) -> np.ndarray:
        return self.pairing.relative_distance <= SUPERMOON_LIMIT

    @property
    def is_micromoon(self) -> np.ndarray:
        return self.pairing.relative_distance >= MICROMOON_LIMIT

    @property
    def syzygy_diameter_arcmin(self) -> np.ndarray:
        return apparent_diameter_arcmin(self.syzygies.distance_km)


def build_catalog(eph: SpiceKernel, t0: Time, t1: Time, margin_days: float = 20) -> Catalog:
    """Finds all events in [t0, t1].

    Apsides are searched a bit beyond the interval, so that syzygies near its
    ends have their neighbouring perigee and apogee.
    """
    ts = t0.ts
    first, last = ephemeris_range_tt(eph)
    first, last = first + 1, last - 1  # searches sample a little around their span
    phases = find_phases(eph, t0, t1)
    apsides = find_apsides(eph, ts.tt_jd(max(t0.tt - margin_days, first)), ts.tt_jd(min(t1.tt + margin_days, last)))
    nodes = find_nodes(eph, t0, t1)
    eclipses = find_lunar_eclipses(eph, t0, t1)

    is_syzygy = (phases.kind == 0) | (phases.kind == 2)
    syzygies = Events(phases.t[is_syzygy], phases.kind[is_syzygy], phases.distance_km[is_syzygy])
    pairing = pair_syzygies_with_apsides(
        syzygies.t.tt, syzygies.distance_km, apsides.t.tt, apsides.distance_km, apsides.kind == 1
    )

    eclipse_kind = np.full(len(syzygies.kind), -1)
    if len(eclipses.kind):
        idx = np.searchsorted(syzygies.t.tt, eclipses.t.tt)
        idx = np.clip(idx, 1, len(syzygies.kind) - 1)
        idx = np.where(
            np.abs(syzygies.t.tt[idx - 1] - eclipses.t.tt) < np.abs(syzygies.t.tt[idx] - eclipses.t.tt), idx - 1, idx
        )
        eclipse_kind[idx] = eclipses.kind

    return Catalog(phases, apsides, nodes, eclipses, syzygies, pairing, eclipse_kind)
