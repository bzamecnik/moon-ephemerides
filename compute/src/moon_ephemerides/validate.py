"""Comparison of our catalog with Espenak's astropixels.com tables."""

from collections import Counter
from dataclasses import dataclass, field
from datetime import UTC, datetime

import numpy as np

from . import astropixels
from .catalog import Catalog
from .events import LUNAR_ECLIPSE_NAMES, apparent_diameter_arcmin

LUNAR_ECLIPSE_CODES = {"penumbral": "n", "partial": "p", "total": "t"}


def _rounded_minutes(t_utc: datetime) -> float:
    """Minutes since epoch, rounded to the minute like the astropixels tables."""
    return round(t_utc.timestamp() / 60)


def _minutes(t: datetime) -> float:
    return t.timestamp() / 60


@dataclass
class Diffs:
    """Differences ours - astropixels for one quantity."""

    name: str
    unit: str
    values: list[float] = field(default_factory=list)

    def summary(self) -> str:
        v = np.array(self.values)
        if not len(v):
            return f"{self.name}: no data"
        hist = Counter(np.round(v, 6).tolist())
        common = ", ".join(f"{k:+g}: {n}" for k, n in sorted(hist.items(), key=lambda kv: -kv[1])[:5])
        return (
            f"{self.name} [{self.unit}]: n={len(v)}, mean={v.mean():+.3f}, max|d|={np.abs(v).max():.3f}"
            f"  (most common: {common})"
        )


def _nearest(sorted_minutes: np.ndarray, m: float) -> int:
    i = int(np.clip(np.searchsorted(sorted_minutes, m), 1, len(sorted_minutes) - 1))
    return i - 1 if abs(sorted_minutes[i - 1] - m) <= abs(sorted_minutes[i] - m) else i


def compare_apsides(catalog: Catalog, rows: list[astropixels.Apsis]) -> list[str]:
    ours_t = catalog.apsides.t.utc_datetime()
    ours_m = np.array([_minutes(t) for t in ours_t])
    time, dist, diam, kind_mismatch = Diffs("time", "min"), Diffs("distance", "km"), Diffs("diameter", "arcmin"), 0

    for r in rows:
        i = _nearest(ours_m, _minutes(r.time))
        kind = "apogee" if catalog.apsides.kind[i] == 1 else "perigee"
        kind_mismatch += kind != r.kind
        time.values.append(_rounded_minutes(ours_t[i]) - _minutes(r.time))
        dist.values.append(round(catalog.apsides.distance_km[i]) - r.distance_km)
        diam.values.append(
            round(float(apparent_diameter_arcmin(catalog.apsides.distance_km[i])), 2) - r.diameter_arcmin
        )
    return [
        f"Perigees and apogees: {len(rows)} rows, kind mismatches: {kind_mismatch}",
        "  " + time.summary(),
        "  " + dist.summary(),
        "  " + diam.summary(),
    ]


def compare_syzygies(catalog: Catalog, rows: list[astropixels.Syzygy]) -> list[str]:
    syz = catalog.syzygies
    p = catalog.pairing
    ours_t = syz.t.utc_datetime()
    ours_m = np.array([_minutes(t) for t in ours_t])
    aps_t = catalog.apsides.t.utc_datetime()

    time, dist, rel, aps_time, delta = (
        Diffs("syzygy time", "min"),
        Diffs("distance", "km"),
        Diffs("relative distance", "1"),
        Diffs("apsis time", "min"),
        Diffs("Δ apsis", "days"),
    )
    mismatched_phase, eclipse_mismatch = 0, []
    matched = set()
    for r in rows:
        i = _nearest(ours_m, _minutes(r.time))
        matched.add((i, r.apsis))
        phase = "new" if syz.kind[i] == 0 else "full"
        mismatched_phase += phase != r.phase
        time.values.append(_rounded_minutes(ours_t[i]) - _minutes(r.time))
        dist.values.append(round(syz.distance_km[i]) - r.distance_km)
        if r.apsis == "perigee":
            our_rel, j, our_delta = 1 - p.relative_distance[i], p.perigee_index[i], p.perigee_delta[i]
        else:
            our_rel, j, our_delta = p.relative_distance[i], p.apogee_index[i], p.apogee_delta[i]
        rel.values.append(round(float(our_rel), 3) - r.relative_distance)
        aps_time.values.append(_rounded_minutes(aps_t[j]) - _minutes(r.apsis_time))
        delta.values.append(round(float(our_delta), 3) - r.apsis_delta_days)
        if r.phase == "full":
            k = catalog.lunar_eclipse_kind[i]
            ours = LUNAR_ECLIPSE_CODES[LUNAR_ECLIPSE_NAMES[k]] if k >= 0 else ""
            if ours != r.eclipse:
                eclipse_mismatch.append(f"{r.time:%Y-%m-%d} ours={ours or '-'} astropixels={r.eclipse or '-'}")

    # completeness: our super/micromoons in the same years that astropixels doesn't list
    first, last = min(r.time for r in rows), max(r.time for r in rows)
    in_range = np.array([first <= t <= last for t in ours_t])
    extra = []
    for flag, apsis in ((catalog.is_supermoon, "perigee"), (catalog.is_micromoon, "apogee")):
        for i in np.flatnonzero(flag & in_range):
            if (i, apsis) not in matched:
                extra.append(
                    f"{ours_t[i]:%Y-%m-%d %H:%M} {'new' if syz.kind[i] == 0 else 'full'} at {apsis},"
                    f" relative distance {p.relative_distance[i]:.4f}"
                )
    by_kind = Counter(f"{r.phase} at {r.apsis}" for r in rows)
    lines = [
        f"Supermoons and micromoons: {len(rows)} rows ({dict(by_kind)}), phase mismatches: {mismatched_phase}",
        *("  " + d.summary() for d in (time, dist, rel, aps_time, delta)),
        f"  lunar eclipse flags differing: {len(eclipse_mismatch)}",
        *("    " + e for e in eclipse_mismatch[:20]),
        f"  ours but not in the tables: {len(extra)}",
        *("    " + e for e in extra[:20]),
    ]
    return lines


def validation_report(catalog: Catalog, directory) -> str:
    lines = [f"Validation against astropixels.com tables ({datetime.now(UTC):%Y-%m-%d})", ""]
    lines += compare_apsides(catalog, astropixels.load_apsides(directory))
    lines += [""]
    lines += compare_syzygies(catalog, astropixels.load_syzygies(directory))
    return "\n".join(lines)
