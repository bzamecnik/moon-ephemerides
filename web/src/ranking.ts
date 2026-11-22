/** The best alignments of the two rhythms: super- and micromoons with the smallest |Δ|. */
import type { MoonEvent } from './events'

export interface Era {
  label: string
  from: number
  to: number
}

export const ERAS: Era[] = [
  { label: '1850–1900', from: 1850, to: 1900 },
  { label: '1901–2000', from: 1901, to: 2000 },
  { label: '2001–2100', from: 2001, to: 2100 },
  { label: '2101–2149', from: 2101, to: 2149 },
  { label: 'All (1850–2149)', from: 1850, to: 2149 },
]

const year = (e: MoonEvent) => new Date(e.syzygy.time).getUTCFullYear()

/** Super- and micromoons in the years [from, to], sorted by |Δ|, at most `limit`. */
export function bestAlignments(events: readonly MoonEvent[], era: Pick<Era, 'from' | 'to'>, limit: number) {
  return events
    .filter((e) => e.kind !== 'ordinary' && year(e) >= era.from && year(e) <= era.to)
    .sort((a, b) => Math.abs(a.deltaDays) - Math.abs(b.deltaDays))
    .slice(0, limit)
}
