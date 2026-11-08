// @vitest-environment happy-dom
import ui from '@nuxt/ui/vue-plugin'
import { ACCENT_COLORS, type AccentColor } from '@one-place/shared'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { i18n } from '@/i18n'
import AccentPicker from './AccentPicker.vue'

function render(modelValue: AccentColor | undefined, inherit = false) {
  return mount(AccentPicker, {
    props: { modelValue, inherit },
    global: { plugins: [ui, i18n] },
  })
}

describe('AccentPicker', () => {
  it('shows a named swatch in the color of each accent', () => {
    const swatches = render('blue').findAll('[role="radio"]')
    expect(swatches).toHaveLength(ACCENT_COLORS.length)
    expect(swatches[7]!.attributes('aria-label')).toBe('Green')
    expect(swatches[7]!.attributes('style')).toContain('var(--color-green-500)')
  })

  it('marks the chosen accent and emits another one', async () => {
    const wrapper = render('rose')
    const checked = wrapper.findAll('[aria-checked="true"]')
    expect(checked.map((swatch) => swatch.attributes('aria-label'))).toEqual(['Rose'])
    await wrapper.get('[aria-label="Teal"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['teal']])
  })

  it('offers the global accent first and emits undefined for it', async () => {
    const wrapper = render('green', true)
    const first = wrapper.findAll('[role="radio"]')[0]!
    expect(first.attributes('aria-label')).toBe('Global')
    expect(first.attributes('aria-checked')).toBe('false')
    await first.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[undefined]])
  })
})
