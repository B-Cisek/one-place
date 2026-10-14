import type { ContextDto } from '@one-place/shared'
import { describe, expect, it } from 'vitest'
import { pickActiveContext } from './active-context'

const work = { id: 'work', name: 'Praca' } as ContextDto
const home = { id: 'home', name: 'Dom' } as ContextDto

describe('pickActiveContext', () => {
  it('returns the remembered context', () => {
    expect(pickActiveContext([work, home], 'home')).toBe(home)
  })

  it('falls back to the first context when the remembered one is gone', () => {
    expect(pickActiveContext([work, home], 'deleted-on-another-device')).toBe(work)
    expect(pickActiveContext([work, home], null)).toBe(work)
  })

  it('returns null when there are no contexts', () => {
    expect(pickActiveContext([], 'work')).toBeNull()
  })
})
