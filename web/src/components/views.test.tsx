import { fireEvent, render, screen, within } from '@testing-library/preact'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { decodeCatalog } from '../data/catalog'
import { rawFixture, utc } from '../test/fixture'
import { EventsView } from './EventsView'

const catalog = decodeCatalog(rawFixture)

function setup(view?: string) {
  const user = userEvent.setup()
  const changes: [number, string][] = []
  render(
    <EventsView
      catalog={catalog}
      initialAnchor={utc('2023-01-10T00:00')}
      initialView={view}
      now={utc('2023-02-01T12:00')}
      onChange={(a, v) => changes.push([a, v])}
    />,
  )
  return { user, changes }
}

const summary = () => screen.getByTestId('summary')

describe('views', () => {
  it('switches between the views with tabs', async () => {
    const { user, changes } = setup()
    expect(screen.getByRole('tab', { name: 'Table' })).toHaveAttribute('aria-selected', 'true')
    await user.click(screen.getByRole('tab', { name: /beat/i }))
    expect(screen.getByRole('img', { name: /nearest perigee/i })).toBeInTheDocument()
    expect(changes.at(-1)?.[1]).toBe('beat')
  })

  it('starts in the view given in the URL', () => {
    setup('phase')
    expect(screen.getByRole('tab', { name: /phase/i })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('img', { name: /perigee and apogee/i })).toBeInTheDocument()
  })

  it('beat chart: one mark per New and Full Moon in the span, a click selects it', () => {
    setup('beat')
    const chart = screen.getByRole('img', { name: /nearest perigee/i })
    const marks = chart.querySelectorAll('.event-mark')
    // all six syzygies of the fixture (Dec 2022 - Feb 2023) fit into the 6-year span
    expect(marks).toHaveLength(6)
    const feb20 = [...marks].find((m) => m.textContent?.includes('2023-02-20'))!
    fireEvent.click(feb20)
    expect(summary()).toHaveTextContent('Closest: New Supermoon on 2023-02-20 07:06')
  })

  it('beat chart: tooltips describe the events', () => {
    setup('beat')
    const chart = screen.getByRole('img', { name: /nearest perigee/i })
    expect(chart).toHaveTextContent('New Supermoon, 2023-01-21 20:53 UTC, Δ perigee +0.003 d')
  })

  it('phase chart: marks the New and Full Moons and the selected moment', () => {
    setup('phase')
    const chart = screen.getByRole('img', { name: /perigee and apogee/i })
    expect(chart.querySelectorAll('.event-mark').length).toBeGreaterThan(0)
    expect(chart.querySelector('.anchor-dot')).not.toBeNull()
  })

  it('best alignments: ranked by |Δ|, "Show" selects the event in the table', async () => {
    const { user } = setup('ranking')
    const rows = screen.getAllByRole('row').filter((r) => r.dataset.time)
    expect(rows.map((r) => within(r).getByTestId('event').textContent)).toEqual([
      'New Supermoon',
      'New Supermoon',
      'New Supermoon',
      'Full Micromoon',
      'Full Micromoon',
    ])
    await user.click(within(rows[0]).getByRole('button', { name: 'Show' }))
    expect(screen.getByRole('tab', { name: 'Table' })).toHaveAttribute('aria-selected', 'true')
    expect(summary()).toHaveTextContent('2023-01-21 20:53')
  })
})
