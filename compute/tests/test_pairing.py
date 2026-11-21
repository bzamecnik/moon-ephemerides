import numpy as np
import pytest

from moon_ephemerides.pairing import nearest_index, pair_syzygies_with_apsides


def test_nearest_index_picks_closest_on_either_side():
    times = np.array([0.0, 10.0, 20.0])
    assert nearest_index(times, np.array([-5.0, 4.0, 6.0, 14.9, 15.1, 99.0])).tolist() == [0, 0, 1, 1, 2, 2]


def test_nearest_index_tie_goes_to_earlier():
    assert nearest_index(np.array([0.0, 10.0]), np.array([5.0])).tolist() == [0]


def test_pairing_delta_and_relative_distance():
    # perigee at day 0 (360 000 km), apogee at day 14 (405 000 km), perigee at day 28 (358 000 km)
    apsis_t = np.array([0.0, 14.0, 28.0])
    apsis_d = np.array([360_000.0, 405_000.0, 358_000.0])
    apsis_is_apogee = np.array([False, True, False])
    # a syzygy one day after the apogee, and one half a day before the second perigee
    syzygy_t = np.array([15.0, 27.5])
    syzygy_d = np.array([404_000.0, 358_450.0])

    p = pair_syzygies_with_apsides(syzygy_t, syzygy_d, apsis_t, apsis_d, apsis_is_apogee)

    # Δ = apsis - syzygy, in days, as in the astropixels tables
    assert p.perigee_delta.tolist() == [13.0, 0.5]
    assert p.apogee_delta.tolist() == [-1.0, -13.5]
    assert p.perigee_index.tolist() == [2, 2]
    assert p.apogee_index.tolist() == [1, 1]
    # 0 at perigee, 1 at apogee, using the nearest perigee and apogee
    assert p.relative_distance[0] == pytest.approx((404_000 - 358_000) / (405_000 - 358_000))
    assert p.relative_distance[1] == pytest.approx((358_450 - 358_000) / (405_000 - 358_000))
