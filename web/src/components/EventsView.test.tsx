import { fireEvent, render, screen, within } from '@testing-library/preact'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { decodeCatalog } from '../data/catalog'
import { rawFixture, utc } from '../test/fixture'
import { cellLabel } from './cells'
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
  return eventRows().map(cellLabel)
}

describe('EventsView', () => {
  it('lists all New and Full Moons in time order, telling super- and micromoons apart', () => {
    setup()
    expect(labels()).toEqual([
      'Full Moon',
      'New Supermoon',
      'Full Micromoon',
      'New Supermoon',
      'Full Micromoon',
      'New Supermoon',
    ])
  })

  it('marks the event closest to the selected moment and summarises it', () => {
    setup() // 2023-01-10 00:00: Full Moon Jan 6 is 3 days before, New Moon Jan 21 12 days after
    const closest = eventRows().find((r) => r.getAttribute('aria-current'))
    expect(closest?.dataset.time).toBe(String(utc('2023-01-06T23:07:54')))
    const summary = screen.getByTestId('summary')
    expect(summary).toHaveTextContent('Closest: Full Micromoon')
    expect(summary).toHaveTextContent('2023-01-06 23:08 UTC')
    expect(summary).toHaveTextContent('3 days ago')
    expect(summary).toHaveTextContent('34.2 h before apogee')
  })

  it('prefers a recent event to a later one', () => {
    setup(utc('2023-02-06T00:00'))
    expect(screen.getByTestId('summary')).toHaveTextContent('2023-02-05 18:29 UTC (6 hours ago)')
  })

  it('shows the time difference to the perigee or apogee', () => {
    setup()
    const row = eventRows()[3]
    expect(within(row).getByTestId('delta')).toHaveTextContent('+0.003')
    expect(row).toHaveClass('close-alignment')
  })

  it('steps to the next and previous event', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: /next event/i }))
    expect(screen.getByTestId('summary')).toHaveTextContent('2023-01-21 20:53')
    await user.click(screen.getByRole('button', { name: /previous event/i }))
    await user.click(screen.getByRole('button', { name: /previous event/i }))
    expect(screen.getByTestId('summary')).toHaveTextContent('2022-12-23 10:17')
  })

  it('jumps to now', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: /^now$/i }))
    expect(screen.getByTestId('summary')).toHaveTextContent('2023-02-05 18:29')
  })

  const dateBox = () => screen.getByRole('textbox', { name: /date/i })

  it('jumps to a typed date and time', async () => {
    const user = setup()
    await user.clear(dateBox())
    await user.type(dateBox(), '2023-02-13 12:00')
    // Feb 5 18:29 is 7.7 days before, Feb 20 07:06 is 6.8 days after
    expect(screen.getByTestId('summary')).toHaveTextContent('Closest: New Supermoon on 2023-02-20 07:06')
  })

  it('shows the selected date as YYYY-MM-DD HH:MM', () => {
    setup()
    expect(dateBox()).toHaveValue('2023-01-10 00:00')
  })

  it('jumps to a typed date', async () => {
    const user = setup()
    await user.clear(dateBox())
    await user.type(dateBox(), '2022-12-01')
    expect(screen.getByTestId('summary')).toHaveTextContent('2022-12-08 04:08')
  })

  it('jumps to a typed year while keeping what is being typed', async () => {
    const user = setup()
    await user.clear(dateBox())
    await user.type(dateBox(), '1989')
    expect(dateBox()).toHaveValue('1989')
    // the fixture has no events before Dec 2022, so the first one is the closest
    expect(screen.getByTestId('summary')).toHaveTextContent('2022-12-08 04:08')
    await user.type(dateBox(), '{Enter}')
    expect(dateBox()).toHaveValue('1989-01-01 00:00')
  })

  it('restores the date when leaving an unfinished one', async () => {
    const user = setup()
    await user.clear(dateBox())
    await user.type(dateBox(), '19')
    expect(dateBox()).toHaveAttribute('aria-invalid', 'true')
    await user.tab()
    expect(dateBox()).toHaveValue('2023-01-10 00:00')
  })

  it('picks a date from the calendar', () => {
    setup()
    fireEvent.change(screen.getByTestId('date-picker'), { target: { value: '2022-12-01' } })
    expect(screen.getByTestId('summary')).toHaveTextContent('2022-12-08 04:08')
    expect(dateBox()).toHaveValue('2022-12-01 00:00')
  })

  it('filters the kinds of events', async () => {
    const user = setup()
    await user.click(screen.getByRole('checkbox', { name: /full micromoon/i }))
    expect(labels()).toEqual(['Full Moon', 'New Supermoon', 'New Supermoon', 'New Supermoon'])
    await user.click(screen.getByRole('checkbox', { name: /other new and full moons/i }))
    expect(labels()).toEqual(['New Supermoon', 'New Supermoon', 'New Supermoon'])
  })

  it('switches between UTC and local time', async () => {
    const user = setup()
    await user.click(screen.getByRole('radio', { name: /local/i }))
    // TZ=Europe/Prague in the tests
    expect(screen.getByRole('radio', { name: /local/i }).parentElement).toHaveTextContent('Europe/Prague')
    expect(screen.getByTestId('summary')).toHaveTextContent('2023-01-07 00:08 (UTC+1)')
    expect(screen.getByRole('columnheader', { name: /^date and time/i })).toHaveTextContent('Europe/Prague')
  })

  it('steps by event with the arrow keys', async () => {
    const user = setup() // closest: Full Micromoon 2023-01-06
    await user.keyboard('{ArrowRight}')
    expect(screen.getByTestId('summary')).toHaveTextContent('2023-01-21 20:53')
    await user.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(screen.getByTestId('summary')).toHaveTextContent('2022-12-23 10:17')
    await user.keyboard('{Shift>}{ArrowRight}{/Shift}')
    // one beat later, clipped to the last one
    expect(screen.getByTestId('summary')).toHaveTextContent('2023-02-20 07:06')
  })

  it('leaves the arrow keys to the date field while typing', async () => {
    const user = setup()
    await user.click(dateBox())
    await user.keyboard('{ArrowRight}')
    expect(screen.getByTestId('summary')).toHaveTextContent('2023-01-06 23:08')
  })

  it('selects a moment by clicking a date in the table', async () => {
    const user = setup()
    const row = eventRows().find((r) => r.dataset.time === String(utc('2023-02-05T18:28:34')))!
    // the date of the nearest apogee, 08:54:40
    await user.click(within(row).getByRole('button', { name: '2023-02-04 08:55' }))
    expect(dateBox()).toHaveValue('2023-02-04 08:55')
    await user.click(within(eventRows()[1]).getByRole('button', { name: '2022-12-23 10:17' }))
    expect(screen.getByTestId('summary')).toHaveTextContent('Closest: New Supermoon on 2022-12-23 10:17')
  })
})
