// @vitest-environment happy-dom
import ui from '@nuxt/ui/vue-plugin'
import type { ThemeMode } from '@one-place/shared'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { i18n } from '@/i18n'
import ThemeModePicker from './ThemeModePicker.vue'

function render(modelValue: ThemeMode | undefined, inherit = false) {
  return mount(ThemeModePicker, {
    props: { modelValue, inherit },
    global: { plugins: [ui, i18n] },
  })
}

function checked(wrapper: ReturnType<typeof render>) {
  return wrapper
    .findAll('[role="radio"]')
    .filter((option) => option.attributes('aria-checked') === 'true')
    .map((option) => option.text())
}

describe('ThemeModePicker', () => {
  it('marks the chosen mode and emits another one', async () => {
    const wrapper = render('dark')
    expect(wrapper.findAll('[role="radio"]').map((option) => option.text())).toEqual([
      'Light',
      'Dark',
      'System',
    ])
    expect(checked(wrapper)).toEqual(['Dark'])
    await wrapper.findAll('[role="radio"]')[2]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['system']])
  })

  it('offers the global mode first and emits undefined for it', async () => {
    const wrapper = render(undefined, true)
    expect(checked(wrapper)).toEqual(['Global'])
    await wrapper.setProps({ modelValue: 'light' })
    await wrapper.findAll('[role="radio"]')[0]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[undefined]])
  })
})
