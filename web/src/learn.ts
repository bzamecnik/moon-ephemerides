/**
 * The learning page: docs/astronomy.md rendered as HTML, so that the
 * explanations are written once. Headings move one level down (the page has
 * its own title) and get ids `learn-…`, which double as the URL (#learn-…).
 */
import { Marked, type Tokens } from 'marked'

export const LEARN_PREFIX = 'learn-'
const DOCS_URL = 'https://github.com/bzamecnik/moon-ephemerides/blob/main/docs/'
/** links to a moment in the published app (they work on GitHub too) open here instead */
const APP_URL = 'https://bzamecnik.github.io/moon-ephemerides/'

/** Sections of docs/astronomy.md that the views link to (a test checks they exist). */
export const LEARN = {
  rhythms: 'learn-three-rhythms',
  frame: 'learn-looking-from-above-turning-with-the-earth-sun-line',
  inchworm: 'learn-why-the-alignments-wobble-the-inchworm',
  longView: 'learn-the-long-view-one-event-per-half-beat',
  phasePicture: 'learn-the-phase-vs-distance-picture',
  eclipses: 'learn-nodes-and-eclipses',
} as const

export interface Section {
  id: string
  title: string
}

export interface LearningPage {
  title: string
  html: string
  sections: Section[]
}

export function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const plain = (text: string) => text.replace(/[*_`]/g, '')

export function renderLearning(markdown: string): LearningPage {
  let title = ''
  const sections: Section[] = []
  const marked = new Marked({
    gfm: true,
    renderer: {
      heading({ tokens, depth, text }: Tokens.Heading) {
        if (depth === 1) {
          title = plain(text)
          return ''
        }
        const id = LEARN_PREFIX + slug(plain(text))
        if (depth === 2) sections.push({ id, title: plain(text) })
        return `<h${depth + 1} id="${id}">${this.parser.parseInline(tokens)}</h${depth + 1}>\n`
      },
      link({ href, title: linkTitle, tokens }: Tokens.Link) {
        const url = href.startsWith(APP_URL + '#')
          ? href.slice(APP_URL.length)
          : /^[a-z]+:|^#/i.test(href)
            ? href
            : new URL(href, DOCS_URL).href
        const t = linkTitle ? ` title="${linkTitle}"` : ''
        return `<a href="${url.replace(/&/g, '&amp;')}"${t}>${this.parser.parseInline(tokens)}</a>`
      },
    },
  })
  const html = marked.parse(markdown, { async: false })
  return { title, html, sections }
}
