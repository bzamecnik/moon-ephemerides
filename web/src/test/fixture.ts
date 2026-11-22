import type { RawCatalog } from '../data/catalog'

/**
 * A slice of the real export: Dec 2022 – Feb 2023. New Moon 2023-01-21 is a
 * supermoon only 0.0027 days (4 minutes) before perigee, flanked by two Full
 * micromoons; the Full Moon of 2022-12-08 is neither.
 */
export const rawFixture: RawCatalog = {
  meta: { format: 1, generator: 'moon-ephemerides 0.1.0', generated: '2026-11-21T14:37:29Z', ephemeris: 'JPL DE440S' },
  apsides: {
    t: [1670804906, 1671870409, 1673169557, 1674334626, 1675500880, 1676797543],
    kind: [1, 0, 1, 0, 1, 0],
    distance_km: [405869, 358270, 406458, 356569, 406476, 358267],
  },
  syzygies: {
    t: [1670472491, 1671790613, 1673046474, 1674334395, 1675621714, 1676876751],
    kind: [2, 0, 2, 0, 2, 0],
    distance_km: [400239, 359081, 405791, 356569, 405830, 359063],
    perigee_delta: [-12.109, 0.9236, -13.6119, 0.0027, 13.6091, -0.9168],
    apogee_delta: [3.8474, -11.4086, 1.4246, -13.4819, -1.3985, 11.4545],
    relative_distance: [0.8692, 0.017, 0.9861, 0.0, 0.9866, 0.0167],
    lunar_eclipse: [-1, -1, -1, -1, -1, -1],
    solar_eclipse: [-1, -1, -1, -1, -1, -1],
  },
}

export const utc = (iso: string) => Date.parse(iso + 'Z')
