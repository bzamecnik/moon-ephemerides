import type { ComponentChildren } from 'preact'
import type { Page } from '../format'

/** The title and the pages, at the top of the sidebar. */
export function SiteHeader({ page, exploreHash }: { page: Page['page']; exploreHash: string }) {
  const current = (p: Page['page']) => (page === p ? 'page' : undefined)
  return (
    <header class="site-header">
      <h1>
        <img class="site-icon" src="./favicon.svg" alt="" width="28" height="28" />
        Moon Ephemerides
      </h1>
      <nav class="pages" aria-label="Pages">
        <a href={exploreHash || '#'} aria-current={current('explore')}>
          Explore
        </a>
        <a href="#about" aria-current={current('about')}>
          About
        </a>
        <a href="#learn" aria-current={current('learn')}>
          Learn: the astronomy
        </a>
      </nav>
    </header>
  )
}

/** A sidebar (the header, then `side`) and the main content; stacked on narrow screens. */
export function Layout({ header, side, children }: { header?: ComponentChildren; side?: ComponentChildren; children: ComponentChildren }) {
  return (
    <div class="layout">
      <aside class="sidebar">
        {header}
        {side}
      </aside>
      <main class="workspace">{children}</main>
    </div>
  )
}
