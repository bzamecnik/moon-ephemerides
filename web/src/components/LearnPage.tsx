import type { ComponentChildren } from 'preact'
import { useEffect, useMemo } from 'preact/hooks'
import astronomy from '../../../docs/astronomy.md?raw'
import { renderLearning } from '../learn'
import { Layout } from './Layout'

/** docs/astronomy.md as a page, with a list of its sections. */
export function LearnPage({ section, header }: { section?: string; header?: ComponentChildren }) {
  const page = useMemo(() => renderLearning(astronomy), [])
  useEffect(() => {
    if (section) document.getElementById(section)?.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [section])
  return (
    <Layout
      header={header}
      side={
        <nav class="learn-toc" aria-label="Sections">
          <ol>
            {page.sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`}>{s.title}</a>
              </li>
            ))}
          </ol>
        </nav>
      }
    >
      <article class="learn">
        <h2>{page.title}</h2>
        <div class="learn-text" dangerouslySetInnerHTML={{ __html: page.html }} />
      </article>
    </Layout>
  )
}

/** A link from a view to a section of the learning page. */
export function LearnMore({ id, children }: { id: string; children: preact.ComponentChildren }) {
  return (
    <a class="learn-more" href={`#${id}`}>
      {children}
    </a>
  )
}
