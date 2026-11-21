/** Formatting of times and durations for the page. */

export type Zone = 'utc' | 'local'

const MINUS = '−'
const HOUR_MS = 3_600_000
const DAY_MS = 86_400_000

const pad = (n: number, width = 2) => String(n).padStart(width, '0')

function parts(ms: number, zone: Zone) {
  const d = new Date(ms)
  return zone === 'utc'
    ? [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes()]
    : [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes()]
}

/** 'YYYY-MM-DD' */
export function formatDate(ms: number, zone: Zone): string {
  const [y, m, d] = parts(ms, zone)
  return `${pad(y, 4)}-${pad(m)}-${pad(d)}`
}

/** 'YYYY-MM-DD HH:mm', rounded to the nearest minute */
export function formatDateTime(ms: number, zone: Zone): string {
  const rounded = Math.round(ms / 60_000) * 60_000
  const [, , , h, min] = parts(rounded, zone)
  return `${formatDate(rounded, zone)} ${pad(h)}:${pad(min)}`
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/

/** A complete 'YYYY-MM-DD' (as in the URL) */
export function isDate(text: string): boolean {
  return DATE_RE.test(text)
}

const PARTIAL_DATE_RE = /^(\d{4})(?:-(\d{1,2})(?:-(\d{1,2}))?)?$/

/**
 * Start of the day in the given zone, or null for an invalid date.
 * Accepts 'YYYY-MM-DD', 'YYYY-MM' (1st of the month) and 'YYYY' (1 January).
 */
export function parseDate(text: string, zone: Zone): number | null {
  const m = PARTIAL_DATE_RE.exec(text.trim())
  if (!m) return null
  const year = Number(m[1])
  const month = m[2] === undefined ? 0 : Number(m[2]) - 1
  const day = m[3] === undefined ? 1 : Number(m[3])
  // setFullYear, unlike Date.UTC or the Date constructor, keeps years 0-99 as they are
  const d = new Date(0)
  if (zone === 'utc') {
    d.setUTCFullYear(year, month, day)
    d.setUTCHours(0, 0, 0, 0)
  } else {
    d.setFullYear(year, month, day)
    d.setHours(0, 0, 0, 0)
  }
  // reject overflows such as February 30 or month 13
  const [y, mo, dd] = zone === 'utc' ? [d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()] : [d.getFullYear(), d.getMonth(), d.getDate()]
  return y === year && mo === month && dd === day ? d.getTime() : null
}

const sign = (x: number) => (x < 0 ? MINUS : '+')

/** Δ in days, e.g. '+0.003' */
export function formatDelta(days: number): string {
  return `${sign(days)}${Math.abs(days).toFixed(3)}`
}

/** A signed duration given in days, in the most readable unit. */
export function formatDuration(days: number): string {
  const a = Math.abs(days)
  if (a < 1 / 24) return `${sign(days)}${Math.round(a * 24 * 60)} min`
  if (a < 2) return `${sign(days)}${(a * 24).toFixed(1)} h`
  return `${sign(days)}${a.toFixed(1)} days`
}

function plural(n: number, unit: string): string {
  return `${n} ${unit}${n === 1 ? '' : 's'}`
}

/** How far `ms` is from `anchor`: 'in 3 days', '2 hours ago', 'now'. */
export function formatRelative(ms: number, anchor: number): string {
  const diff = ms - anchor
  const a = Math.abs(diff)
  let text: string
  if (a < HOUR_MS) return 'now'
  else if (a < DAY_MS) text = plural(Math.round(a / HOUR_MS), 'hour')
  else if (a < 60 * DAY_MS) text = plural(Math.round(a / DAY_MS), 'day')
  else if (a < 730 * DAY_MS) text = plural(Math.round(a / (30.44 * DAY_MS)), 'month')
  else text = `${(a / (365.25 * DAY_MS)).toFixed(1)} years`
  return diff > 0 ? `in ${text}` : `${text} ago`
}

/** The selected date in the URL, so that a view can be shared: '#date=2023-01-21'. */
export function formatHash(date: string): string {
  return `#date=${date}`
}

export function parseHash(hash: string): string | null {
  const date = new URLSearchParams(hash.replace(/^#/, '')).get('date')
  return date && isDate(date) ? date : null
}
