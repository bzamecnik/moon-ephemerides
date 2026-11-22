/** Heroicons (MIT, Tailwind Labs), the 20 px solid set, inlined so that they take the text colour. */
import backward from 'heroicons/20/solid/backward.svg?raw'
import calendar from 'heroicons/20/solid/calendar-days.svg?raw'
import chevronDown from 'heroicons/20/solid/chevron-down.svg?raw'
import chevronLeft from 'heroicons/20/solid/chevron-left.svg?raw'
import chevronRight from 'heroicons/20/solid/chevron-right.svg?raw'
import clock from 'heroicons/20/solid/clock.svg?raw'
import forward from 'heroicons/20/solid/forward.svg?raw'
import funnel from 'heroicons/20/solid/funnel.svg?raw'
import info from 'heroicons/20/solid/information-circle.svg?raw'
import pause from 'heroicons/20/solid/pause.svg?raw'
import play from 'heroicons/20/solid/play.svg?raw'
import question from 'heroicons/20/solid/question-mark-circle.svg?raw'
import signal from 'heroicons/20/solid/signal.svg?raw'

const ICONS = {
  backward,
  calendar,
  chevronDown,
  chevronLeft,
  chevronRight,
  clock,
  forward,
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
