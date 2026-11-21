import json
from datetime import UTC, datetime

import pytest

from moon_ephemerides.catalog import build_catalog
from moon_ephemerides.export import catalog_to_dict, write_json


@pytest.fixture(scope="module")
def data(eph, ts):
    return catalog_to_dict(build_catalog(eph, ts.utc(2023, 1, 1), ts.utc(2023, 3, 1)))


def test_columns_have_equal_lengths(data):
    for table in ("phases", "apsides", "nodes", "lunar_eclipses", "syzygies"):
        lengths = {len(col) for col in data[table].values()}
        assert len(lengths) == 1, table


def test_times_are_unix_seconds_utc(data):
    s = data["syzygies"]
    i = s["kind"].index(0)  # first New Moon of 2023
    t = datetime.fromtimestamp(s["t"][i], UTC)
    assert t.strftime("%Y-%m-%d %H:%M") == "2023-01-21 20:53"
    assert abs(s["perigee_delta"][i] - 0.003) < 0.002


def test_json_roundtrip(eph, ts, tmp_path):
    path = tmp_path / "events.json"
    write_json(build_catalog(eph, ts.utc(2023, 1, 1), ts.utc(2023, 2, 1)), path)
    loaded = json.loads(path.read_text())
    assert loaded["meta"]["ephemeris"] == "JPL DE440S"
    assert loaded["meta"]["kinds"]["apsides"] == ["perigee", "apogee"]
