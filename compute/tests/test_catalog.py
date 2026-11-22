import numpy as np
import pytest

from moon_ephemerides.catalog import build_catalog


@pytest.fixture(scope="module")
def catalog(eph, ts):
    return build_catalog(eph, ts.utc(2022, 7, 1), ts.utc(2023, 7, 1))


def find_syzygy(catalog, ts, *date):
    i = np.argmin(np.abs(catalog.syzygies.t.tt - ts.utc(*date).tt))
    return i


def test_2023_january_sequence(catalog, ts):
    """Full micromoon, new supermoon at perigee (Δ ≈ 0.003 d), full micromoon."""
    p = catalog.pairing
    i = find_syzygy(catalog, ts, 2023, 1, 21, 20, 53)
    assert catalog.syzygies.kind[i] == 0
    assert p.perigee_delta[i] == pytest.approx(0.003, abs=0.002)
    assert p.relative_distance[i] == pytest.approx(0.0, abs=0.001)
    assert catalog.is_supermoon[i]

    before, after = i - 1, i + 1
    assert catalog.syzygies.kind[before] == catalog.syzygies.kind[after] == 2
    assert catalog.is_micromoon[before] and catalog.is_micromoon[after]
    assert p.apogee_delta[before] == pytest.approx(1.424, abs=0.002)
    assert p.apogee_delta[after] == pytest.approx(-1.398, abs=0.002)


def test_lunar_eclipse_attached_to_full_moon(catalog, ts):
    i = find_syzygy(catalog, ts, 2022, 11, 8, 11)
    assert catalog.syzygies.kind[i] == 2
    assert catalog.lunar_eclipse_kind[i] == 2
    # new moons never get a lunar eclipse
    assert (catalog.lunar_eclipse_kind[catalog.syzygies.kind == 0] == -1).all()


def test_solar_eclipse_attached_to_new_moon(catalog, ts):
    i = find_syzygy(catalog, ts, 2023, 4, 20, 4)
    assert catalog.syzygies.kind[i] == 0
    assert catalog.solar_eclipse_kind[i] == 2
    j = find_syzygy(catalog, ts, 2022, 10, 25, 11)
    assert catalog.solar_eclipse_kind[j] == 0
    assert (catalog.solar_eclipse_kind[catalog.syzygies.kind == 2] == -1).all()
    assert (catalog.solar_eclipse_kind >= 0).sum() == 2  # 2022-10-25 and 2023-04-20


def test_catalog_at_the_edge_of_the_ephemeris(eph, ts):
    # the apsis search margin must not run past the start of DE440s (1849-12-26)
    c = build_catalog(eph, ts.utc(1850, 1, 1), ts.utc(1850, 3, 1))
    assert len(c.syzygies.kind) >= 4
