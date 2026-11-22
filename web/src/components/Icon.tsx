/** Heroicons (MIT, Tailwind Labs), the 24 px outline set, inlined so that they take the text colour. */
import calendar from 'heroicons/24/outline/calendar-days.svg?raw'
import chevronDoubleLeft from 'heroicons/24/outline/chevron-double-left.svg?raw'
import chevronDoubleRight from 'heroicons/24/outline/chevron-double-right.svg?raw'
import chevronDown from 'heroicons/24/outline/chevron-down.svg?raw'
import chevronLeft from 'heroicons/24/outline/chevron-left.svg?raw'
import chevronRight from 'heroicons/24/outline/chevron-right.svg?raw'
import clock from 'heroicons/24/outline/clock.svg?raw'
import funnel from 'heroicons/24/outline/funnel.svg?raw'
import info from 'heroicons/24/outline/information-circle.svg?raw'
import pause from 'heroicons/24/outline/pause.svg?raw'
import play from 'heroicons/24/outline/play.svg?raw'
import question from 'heroicons/24/outline/question-mark-circle.svg?raw'
import signal from 'heroicons/24/outline/signal.svg?raw'

const ICONS = {
  chevronDoubleLeft,
  chevronDoubleRight,
  calendar,
  chevronDown,
  chevronLeft,
  chevronRight,
  clock,
  funnel,
  info,
  pause,
  play,
  question,
  signal,
}

export type IconName = keyof typeof ICONS

/** Decorative: the button or link around it carries the accessible name. */
export function Icon({ name }: { name: IconName }) {
  return <span class="icon-svg" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS[name] }} />
}
