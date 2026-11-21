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

const PARTIAL_RE = /^(\d{4})(?:-(\d{1,2})(?:-(\d{1,2})(?:[ T](\d{1,2})(?::(\d{2}))?)?)?)?$/

/**
 * A moment typed as 'YYYY-MM-DD HH:MM' (or with 'T'), in the given zone, or null.
 * Shorter forms mean the start: 'YYYY-MM-DD HH', 'YYYY-MM-DD', 'YYYY-MM', 'YYYY'.
 */
export function parseDateTime(text: string, zone: Zone): number | null {
  const m = PARTIAL_RE.exec(text.trim())
  if (!m) return null
  const year = Number(m[1])
  const month = m[2] === undefined ? 0 : Number(m[2]) - 1
  const day = m[3] === undefined ? 1 : Number(m[3])
  const hour = m[4] === undefined ? 0 : Number(m[4])
  const minute = m[5] === undefined ? 0 : Number(m[5])
  if (hour > 23 || minute > 59) return null
  // setFullYear, unlike Date.UTC or the Date constructor, keeps years 0-99 as they are
  const d = new Date(0)
  if (zone === 'utc') {
    d.setUTCFullYear(year, month, day)
    d.setUTCHours(hour, minute, 0, 0)
  } else {
    d.setFullYear(year, month, day)
    d.setHours(hour, minute, 0, 0)
  }
  // reject overflows such as February 30 or month 13
  const [y, mo, dd] = parts(d.getTime(), zone)
  return y === year && mo === month + 1 && dd === day ? d.getTime() : null
}

/** Offset of local time from UTC at that moment, e.g. 'UTC+1', 'UTC+5:30', 'UTC−3' */
export function formatOffset(ms: number): string {
  const minutes = -new Date(ms).getTimezoneOffset()
  const a = Math.abs(minutes)
  const hm = a % 60 === 0 ? `${a / 60}` : `${Math.floor(a / 60)}:${pad(a % 60)}`
  return `UTC${minutes < 0 ? MINUS : '+'}${hm}`
}

/** Name of the browser's time zone, e.g. 'Europe/Prague' */
export function localZoneName(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

/** Date and time with the zone: '2023-01-21 20:53 UTC' or '2023-01-21 21:53 (UTC+1)' */
export function formatZoned(ms: number, zone: Zone): string {
  return zone === 'utc' ? `${formatDateTime(ms, zone)} UTC` : `${formatDateTime(ms, zone)} (${formatOffset(ms)})`
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

/**
 * The selected moment in the URL, so that a view can be shared:
 * '#date=2023-01-21' or '#date=2023-01-21T13:45' (UTC).
 */
export function formatHash(ms: number): string {
  const time = formatDateTime(ms, 'utc')
  return `#date=${time.endsWith(' 00:00') ? time.slice(0, 10) : time.replace(' ', 'T')}`
}

export function parseHash(hash: string): number | null {
  const text = new URLSearchParams(hash.replace(/^#/, '')).get('date')
  return text === null ? null : parseDateTime(text, 'utc')
}
