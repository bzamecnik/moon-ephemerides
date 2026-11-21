"""Pairing of syzygies (New/Full Moon) with the nearest apsides (perigee/apogee).

Pure numpy, no ephemeris needed: times are plain floats (days), distances in km.
"""

from dataclasses import dataclass

import numpy as np


def nearest_index(sorted_times: np.ndarray, t: np.ndarray) -> np.ndarray:
    """Index of the element of `sorted_times` nearest to each `t` (ties go to the earlier one)."""
    right = np.clip(np.searchsorted(sorted_times, t), 1, len(sorted_times) - 1)
    left = right - 1
    take_right = np.abs(sorted_times[right] - t) < np.abs(t - sorted_times[left])
    return np.where(take_right, right, left)


@dataclass(frozen=True)
class Pairing:
    """For each syzygy: the nearest perigee and apogee (indices into the apsis arrays)."""

    perigee_index: np.ndarray
    apogee_index: np.ndarray
    perigee_delta: np.ndarray
    """perigee time - syzygy time (days)"""
    apogee_delta: np.ndarray
    """apogee time - syzygy time (days)"""
    relative_distance: np.ndarray
    """(D - D_perigee) / (D_apogee - D_perigee): 0 at perigee, 1 at apogee"""


def pair_syzygies_with_apsides(
    syzygy_t: np.ndarray,
    syzygy_d: np.ndarray,
    apsis_t: np.ndarray,
    apsis_d: np.ndarray,
    apsis_is_apogee: np.ndarray,
) -> Pairing:
    """Pairs each syzygy with its nearest perigee and nearest apogee.

    The relative distance follows Espenak's definition (astropixels.com),
    using the distances of the nearest perigee and apogee.
    """
    perigees = np.flatnonzero(~apsis_is_apogee)
    apogees = np.flatnonzero(apsis_is_apogee)
    p_idx = perigees[nearest_index(apsis_t[perigees], syzygy_t)]
    a_idx = apogees[nearest_index(apsis_t[apogees], syzygy_t)]
    d_p = apsis_d[p_idx]
    d_a = apsis_d[a_idx]
    return Pairing(
        perigee_index=p_idx,
        apogee_index=a_idx,
        perigee_delta=apsis_t[p_idx] - syzygy_t,
        apogee_delta=apsis_t[a_idx] - syzygy_t,
        relative_distance=(syzygy_d - d_p) / (d_a - d_p),
    )
