"""Export of the catalog as compact, columnar JSON for the web app.

Times are Unix seconds (UTC), distances km (integers), deltas days.
"""

import json
from datetime import UTC, datetime
from importlib.metadata import version

import numpy as np
from skyfield.timelib import Time

from .catalog import Catalog
from .events import EPHEMERIS

FORMAT_VERSION = 1


def unix_seconds(t: Time) -> list[int]:
    # TT -> UTC through skyfield's leap second table, then to POSIX seconds
    return [round(d.timestamp()) for d in t.utc_datetime()]


def _rounded(a: np.ndarray, digits: int) -> list[float]:
    return np.round(a.astype(float), digits).tolist()


def catalog_to_dict(catalog: Catalog) -> dict:
    p = catalog.pairing
    return {
        "meta": {
            "format": FORMAT_VERSION,
            "generator": f"moon-ephemerides {version('moon-ephemerides')}",
            "generated": datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "ephemeris": f"JPL {EPHEMERIS.removesuffix('.bsp').upper()}",
            "units": {"t": "Unix seconds UTC", "distance_km": "km, geocentric", "delta": "days"},
            "kinds": {
                "phases": ["new", "first_quarter", "full", "last_quarter"],
                "apsides": ["perigee", "apogee"],
                "nodes": ["descending", "ascending"],
                "lunar_eclipses": ["penumbral", "partial", "total"],
                "solar_eclipses": ["partial", "annular", "total"],
            },
        },
        "phases": {
            "t": unix_seconds(catalog.phases.t),
            "kind": catalog.phases.kind.tolist(),
        },
        "apsides": {
            "t": unix_seconds(catalog.apsides.t),
            "kind": catalog.apsides.kind.tolist(),
            "distance_km": np.round(catalog.apsides.distance_km).astype(int).tolist(),
        },
        "nodes": {
            "t": unix_seconds(catalog.nodes.t),
            "kind": catalog.nodes.kind.tolist(),
        },
        "lunar_eclipses": {
            "t": unix_seconds(catalog.lunar_eclipses.t),
            "kind": catalog.lunar_eclipses.kind.tolist(),
        },
        "solar_eclipses": {
            "t": unix_seconds(catalog.solar_eclipses.t),
            "kind": catalog.solar_eclipses.kind.tolist(),
        },
        # New (kind 0) and Full (kind 2) Moons with their nearest perigee and apogee
        "syzygies": {
            "t": unix_seconds(catalog.syzygies.t),
            "kind": catalog.syzygies.kind.tolist(),
            "distance_km": np.round(catalog.syzygies.distance_km).astype(int).tolist(),
            "perigee_delta": _rounded(p.perigee_delta, 4),
            "apogee_delta": _rounded(p.apogee_delta, 4),
            "relative_distance": _rounded(p.relative_distance, 4),
            "lunar_eclipse": catalog.lunar_eclipse_kind.tolist(),
            "solar_eclipse": catalog.solar_eclipse_kind.tolist(),
        },
    }


def write_json(catalog: Catalog, path) -> None:
    with open(path, "w") as f:
        json.dump(catalog_to_dict(catalog), f, separators=(",", ":"))
