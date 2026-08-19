import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Badge } from '@/lib/ui'

/**
 * Placeholder so `npm test` is green from the first commit. Replace it.
 *
 * If you write only one real test, make it one that pins a behaviour you had to
 * reason about — the reconciliation rule is the obvious candidate.
 */
describe('test setup', () => {
  it('renders', () => {
    render(<Badge>ready</Badge>)
    expect(screen.getByText('ready')).toBeInTheDocument()
  })
})
