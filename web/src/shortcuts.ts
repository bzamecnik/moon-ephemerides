/** Keyboard shortcuts of the explorer, as a pure mapping from a key press to an action. */

export type Action =
  | { type: 'step'; n: 1 | -1 }
  | { type: 'beat'; n: 1 | -1 }
  | { type: 'play' }
  | { type: 'now' }
  | { type: 'date' }
  | { type: 'view'; index: number }
  | { type: 'speed'; dir: 1 | -1 }
  | { type: 'help' }

export interface KeyContext {
  /** typing in a text field, select box, … */
  inField: boolean
  /** a button or link has the focus (it handles Space itself) */
  onButton: boolean
}

export interface KeyPress {
  key: string
  shiftKey: boolean
  altKey?: boolean
  ctrlKey?: boolean
  metaKey?: boolean
}

/** For the help panel. */
export const SHORTCUTS: [string[], string][] = [
  [['←', '→'], 'previous / next New or Full Moon'],
  [['Shift', '←', '→'], 'one beat (about 14 months) back / forward'],
  [['Space'], 'play / pause (also K)'],
  [['[', ']'], 'smaller / larger play step'],
  [['N'], 'now'],
  [['D'], 'type a date'],
  [['1', '…', '7'], 'switch the view'],
  [['?'], 'show / hide this list'],
]

export function shortcutAction(e: KeyPress, ctx: KeyContext): Action | null {
  if (e.altKey || e.ctrlKey || e.metaKey || ctx.inField) return null
  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowLeft': {
      const n = e.key === 'ArrowRight' ? 1 : -1
      return e.shiftKey ? { type: 'beat', n } : { type: 'step', n }
    }
    case ' ':
      return ctx.onButton ? null : { type: 'play' }
    case 'k':
    case 'K':
      return { type: 'play' }
    case 'n':
    case 'N':
      return { type: 'now' }
    case 'd':
    case 'D':
      return { type: 'date' }
    case '[':
      return { type: 'speed', dir: -1 }
    case ']':
      return { type: 'speed', dir: 1 }
    case '?':
      return { type: 'help' }
  }
  if (/^[1-7]$/.test(e.key)) return { type: 'view', index: Number(e.key) - 1 }
  return null
}
