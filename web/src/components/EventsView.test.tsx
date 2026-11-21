import { fireEvent, render, screen, within } from '@testing-library/preact'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { decodeCatalog } from '../data/catalog'
import { rawFixture, utc } from '../test/fixture'
import { EventsView } from './EventsView'

const catalog = decodeCatalog(rawFixture)

function setup(anchor = utc('2023-01-10T00:00')) {
  const user = userEvent.setup()
  render(<EventsView catalog={catalog} initialAnchor={anchor} now={utc('2023-02-01T12:00')} />)
  return user
}

/** Event rows of the table (without the header and the "selected moment" divider). */
function eventRows() {
  return screen.getAllByRole('row').filter((r) => r.dataset.time)
}

function labels() {
  return eventRows().map((r) => within(r).getByTestId('event').textContent)
}

describe('EventsView', () => {
  it('lists the four kinds of super- and micromoons together, in time order', () => {
    setup()
    expect(labels()).toEqual(['New Supermoon', 'Full Micromoon', 'New Supermoon', 'Full Micromoon', 'New Supermoon'])
  })

  it('marks the next event after the selected moment and summarises it', () => {
    setup()
    const next = eventRows().find((r) => r.getAttribute('aria-current'))
    expect(next?.dataset.time).toBe(String(utc('2023-01-21T20:53:15')))
    const summary = screen.getByTestId('next-summary')
    expect(summary).toHaveTextContent('New Supermoon')
    expect(summary).toHaveTextContent('2023-01-21 20:53 UTC')
    expect(summary).toHaveTextContent('in 12 days')
    expect(summary).toHaveTextContent('4 min before perigee')
  })

  it('shows the time difference to the perigee or apogee', () => {
    setup()
    const row = eventRows()[2]
    expect(within(row).getByTestId('delta')).toHaveTextContent('+0.003')
    expect(row).toHaveClass('close-alignment')
  })

  it('steps to the next and previous event', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: /next event/i }))
    expect(screen.getByTestId('next-summary')).toHaveTextContent('2023-02-05 18:29')
    await user.click(screen.getByRole('button', { name: /previous event/i }))
    await user.click(screen.getByRole('button', { name: /previous event/i }))
    expect(screen.getByTestId('next-summary')).toHaveTextContent('2023-01-06 23:08')
  })

  it('jumps to now', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: /^now$/i }))
    expect(screen.getByTestId('next-summary')).toHaveTextContent('2023-02-05 18:29')
  })

  const dateBox = () => screen.getByRole('textbox', { name: /date/i })

  it('shows the selected date as YYYY-MM-DD', () => {
    setup()
    expect(dateBox()).toHaveValue('2023-01-10')
  })

  it('jumps to a typed date', async () => {
    const user = setup()
    await user.clear(dateBox())
    await user.type(dateBox(), '2022-12-01')
    expect(screen.getByTestId('next-summary')).toHaveTextContent('2022-12-23 10:17')
  })

  it('jumps to a typed year while keeping what is being typed', async () => {
    const user = setup()
    await user.clear(dateBox())
    await user.type(dateBox(), '1989')
    expect(dateBox()).toHaveValue('1989')
    // the fixture has no events before Dec 2022, so the first one is next
    expect(screen.getByTestId('next-summary')).toHaveTextContent('2022-12-23 10:17')
    await user.type(dateBox(), '{Enter}')
    expect(dateBox()).toHaveValue('1989-01-01')
  })

  it('restores the date when leaving an unfinished one', async () => {
    const user = setup()
    await user.clear(dateBox())
    await user.type(dateBox(), '19')
    expect(dateBox()).toHaveAttribute('aria-invalid', 'true')
    await user.tab()
    expect(dateBox()).toHaveValue('2023-01-10')
  })

  it('picks a date from the calendar', () => {
    setup()
    fireEvent.change(screen.getByTestId('date-picker'), { target: { value: '2022-12-01' } })
    expect(screen.getByTestId('next-summary')).toHaveTextContent('2022-12-23 10:17')
    expect(dateBox()).toHaveValue('2022-12-01')
  })

  it('filters the kinds of events', async () => {
    const user = setup()
    await user.click(screen.getByRole('checkbox', { name: /full micromoon/i }))
    expect(labels()).toEqual(['New Supermoon', 'New Supermoon', 'New Supermoon'])
    await user.click(screen.getByRole('checkbox', { name: /other new and full moons/i }))
    expect(labels()).toContain('Full Moon')
  })

  it('switches between UTC and local time', async () => {
    const user = setup()
    await user.click(screen.getByRole('radio', { name: /local/i }))
    // TZ=Europe/Prague in the tests
    expect(screen.getByTestId('next-summary')).toHaveTextContent('2023-01-21 21:53')
  })
})
