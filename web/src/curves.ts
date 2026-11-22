/**
 * A smooth curve through points sorted by time: cubic Hermite segments with
 * slopes from the neighbouring points (Catmull–Rom for uneven spacing).
 * Exact at the points; between them it follows a smooth wave far better than
 * straight lines.
 */
export interface CurvePoint {
  time: number
  value: number
}

export function smoothThrough(points: readonly CurvePoint[], samplesPerSegment: number): CurvePoint[] {
  if (points.length < 2) return [...points]
  const n = points.length
  const slope = (i: number) => {
    const a = points[Math.max(i - 1, 0)]
    const b = points[Math.min(i + 1, n - 1)]
    return (b.value - a.value) / (b.time - a.time)
  }
  const out: CurvePoint[] = [points[0]]
  for (let i = 0; i < n - 1; i++) {
    const [p, q] = [points[i], points[i + 1]]
    const h = q.time - p.time
    const [m0, m1] = [slope(i) * h, slope(i + 1) * h]
    for (let k = 1; k < samplesPerSegment; k++) {
      const s = k / samplesPerSegment
      const [s2, s3] = [s * s, s * s * s]
      const value =
        (2 * s3 - 3 * s2 + 1) * p.value + (s3 - 2 * s2 + s) * m0 + (-2 * s3 + 3 * s2) * q.value + (s3 - s2) * m1
      out.push({ time: p.time + s * h, value })
    }
    out.push(q)
  }
  return out
}
