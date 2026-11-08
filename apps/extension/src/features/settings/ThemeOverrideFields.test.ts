// @vitest-environment happy-dom
import ui from '@nuxt/ui/vue-plugin'
import type { ThemeOverride } from '@one-place/shared'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { i18n } from '@/i18n'
import ThemeOverrideFields from './ThemeOverrideFields.vue'

function render(modelValue: ThemeOverride | null) {
  return mount(ThemeOverrideFields, {
    props: { modelValue },
    global: { plugins: [ui, i18n] },
  })
}

describe('ThemeOverrideFields', () => {
  it('uses the global theme without an override and hides the fields', () => {
    const wrapper = render(null)
    expect(wrapper.get('[role="switch"]').attributes('aria-checked')).toBe('true')
    expect(wrapper.find('[role="radiogroup"]').exists()).toBe(false)
  })

  it('starts an empty override when the switch is turned off', async () => {
    const wrapper = render(null)
    await wrapper.get('[role="switch"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[{}]])
  })

  it('shows both fields as global in an empty override', () => {
    const wrapper = render({})
    const checked = wrapper.findAll('[aria-checked="true"][role="radio"]')
    expect(checked).toHaveLength(2)
    for (const option of checked) {
      expect(option.attributes('aria-label') ?? option.text()).toBe('Global')
    }
  })

  it('overrides one field and keeps the other', async () => {
    const wrapper = render({ mode: 'dark' })
    await wrapper.get('[aria-label="Rose"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[{ mode: 'dark', accent: 'rose' }]])
  })

  it('removes the override when the switch is turned on', async () => {
    const wrapper = render({ accent: 'rose' })
    await wrapper.get('[role="switch"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[null]])
  })
})
