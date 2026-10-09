import { describe, expect, it } from 'vitest'
import { accentCssVariables, COLOR_SHADES } from './theme'

describe('accentCssVariables', () => {
  it('maps accent color to CSS variable', () => {
    const vars = accentCssVariables('green')
    expect(vars['--ui-color-primary-500']).toBe('var(--color-green-500)')
    expect(vars['--ui-color-primary-950']).toBe('var(--color-green-950)')
  })

  it('returns exactly one variable for each accent color', () => {
    expect(Object.keys(accentCssVariables('blue'))).toHaveLength(COLOR_SHADES.length)
  })
})
