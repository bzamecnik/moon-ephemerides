import pytest

from moon_ephemerides.events import load_ephemeris


@pytest.fixture(scope="session")
def ephemeris():
    return load_ephemeris()


@pytest.fixture(scope="session")
def ts(ephemeris):
    return ephemeris[0]


@pytest.fixture(scope="session")
def eph(ephemeris):
    return ephemeris[1]
