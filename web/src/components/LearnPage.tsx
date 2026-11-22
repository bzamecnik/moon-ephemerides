import { useEffect, useMemo } from 'preact/hooks'
import astronomy from '../../../docs/astronomy.md?raw'
import { renderLearning } from '../learn'

/** docs/astronomy.md as a page, with a list of its sections. */
export function LearnPage({ section }: { section?: string }) {
  const page = useMemo(() => renderLearning(astronomy), [])
  useEffect(() => {
    if (section) document.getElementById(section)?.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [section])
  return (
    <article class="learn">
      <h2>{page.title}</h2>
      <nav class="learn-toc" aria-label="Sections">
        <ol>
          {page.sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`}>{s.title}</a>
            </li>
          ))}
        </ol>
      </nav>
      <div class="learn-text" dangerouslySetInnerHTML={{ __html: page.html }} />
    </article>
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
