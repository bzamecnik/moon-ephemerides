import { render, screen, within } from '@testing-library/preact'
import { describe, expect, it } from 'vitest'
import { LearnPage } from './LearnPage'

describe('LearnPage', () => {
  it('shows docs/astronomy.md with a list of its sections', () => {
    render(<LearnPage />)
    expect(screen.getByRole('heading', { level: 2, name: 'The astronomy behind it' })).toBeInTheDocument()
    const toc = screen.getByRole('navigation', { name: 'Sections' })
    expect(within(toc).getByRole('link', { name: 'Nodes and eclipses' })).toHaveAttribute(
      'href',
      '#learn-nodes-and-eclipses',
    )
    expect(screen.getByRole('heading', { level: 3, name: 'Nodes and eclipses' })).toHaveAttribute(
      'id',
      'learn-nodes-and-eclipses',
    )
  })
})
