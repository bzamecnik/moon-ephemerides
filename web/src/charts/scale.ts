/** Minimal chart scales: linear mapping and calendar ticks (UTC). */

export function linearScale([d0, d1]: [number, number], [r0, r1]: [number, number]) {
  return (v: number) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0)
}

function utcDate(year: number, month = 0): number {
  const d = new Date(0)
  d.setUTCFullYear(year, month, 1)
  return d.getTime()
}

/** Ticks on New Year (step 1, 2, 5, 10, ... years) or, for short spans, on the 1st of months. */
export function yearTicks(t0: number, t1: number, maxTicks: number): number[] {
  const y0 = new Date(t0).getUTCFullYear()
  const y1 = new Date(t1).getUTCFullYear()
  const years = (t1 - t0) / (365.25 * 86_400_000)
  if (years >= 2) {
    const step = [1, 2, 5, 10, 20, 50, 100].find((s) => years / s <= maxTicks) ?? 100
    const ticks = []
    for (let y = Math.ceil(y0 / step) * step; y <= y1; y += step) {
      const t = utcDate(y)
      if (t >= t0 && t <= t1) ticks.push(t)
    }
    return ticks
  }
  const months = years * 12
  const step = [1, 2, 3, 6].find((s) => months / s <= maxTicks) ?? 6
  const ticks = []
  for (let m = new Date(t0).getUTCMonth(), y = y0; utcDate(y, m) <= t1; m++) {
    const t = utcDate(y + Math.floor(m / 12), m % 12)
    if (t > t1) break
    if (t >= t0 && (m % 12) % step === 0) ticks.push(t)
  }
  return ticks
}
