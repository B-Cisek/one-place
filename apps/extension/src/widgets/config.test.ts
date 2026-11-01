import { TodoConfigSchema } from '@one-place/shared'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolveConfig } from './config'

const defaults = { title: '', hideCompleted: false, source: { type: 'local' } }

describe('resolveConfig', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns a valid config with the missing fields filled in', () => {
    expect(resolveConfig(TodoConfigSchema, { title: ' Zakupy ' })).toEqual({
      ...defaults,
      title: 'Zakupy',
    })
  })

  it('keeps the valid fields and resets the invalid ones, with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(resolveConfig(TodoConfigSchema, { title: 123, hideCompleted: true })).toEqual({
      ...defaults,
      hideCompleted: true,
    })
    expect(warn).toHaveBeenCalledOnce()
  })

  it('uses the default config when the saved one is not an object', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(resolveConfig(TodoConfigSchema, null)).toEqual(defaults)
    expect(resolveConfig(TodoConfigSchema, 'oops')).toEqual(defaults)
  })
})
