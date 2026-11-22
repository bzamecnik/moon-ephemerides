import { describe, expect, it } from 'vitest'
import astronomy from '../../docs/astronomy.md?raw'
import { LEARN, renderLearning, slug } from './learn'

describe('slug', () => {
  it('makes a readable id from a heading', () => {
    expect(slug('Why the alignments wobble (the "inchworm")')).toBe('why-the-alignments-wobble-the-inchworm')
    expect(slug("Relative distance (Espenak's supermoon definition)")).toBe('relative-distance-espenaks-supermoon-definition')
  })
})

describe('renderLearning', () => {
  const md = [
    '# The title',
    '',
    'Intro with a [link](./validation.md) and [another](https://example.org/).',
    '',
    '## First *part*',
    '',
    '| a | b |',
    '|---|---|',
    '| 1 | 2 |',
    '',
    '## Second',
    '',
    'Text.',
  ].join('\n')
  const page = renderLearning(md)

  it('takes the title out and lists the sections', () => {
    expect(page.title).toBe('The title')
    expect(page.sections).toEqual([
      { id: 'learn-first-part', title: 'First part' },
      { id: 'learn-second', title: 'Second' },
    ])
    expect(page.html).not.toContain('The title')
  })

  it('renders the sections one level lower, with ids to link to', () => {
    expect(page.html).toContain('<h3 id="learn-first-part">First <em>part</em></h3>')
    expect(page.html).toContain('<table>')
  })

  it('points links to other docs at the repository', () => {
    expect(page.html).toContain('href="https://github.com/bzamecnik/moon-ephemerides/blob/main/docs/validation.md"')
    expect(page.html).toContain('href="https://example.org/"')
  })

  it('renders docs/astronomy.md', () => {
    const real = renderLearning(astronomy)
    expect(real.title).toBe('The astronomy behind it')
    expect(real.sections.map((s) => s.id)).toContain('learn-nodes-and-eclipses')
    expect(real.sections.map((s) => s.id)).toContain('learn-looking-from-above-the-frame-of-the-sun')
  })

  it('has every section the views link to', () => {
    const ids = renderLearning(astronomy).sections.map((s) => s.id)
    for (const id of Object.values(LEARN)) expect(ids).toContain(id)
  })
})
