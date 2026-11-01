// @vitest-environment happy-dom
import ui from '@nuxt/ui/vue-plugin'
import type { WidgetDto } from '@one-place/shared'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { i18n } from '@/i18n'
import TodoSettings from './TodoSettings.vue'

function widget(config: unknown): WidgetDto {
  return {
    id: 'tasks',
    contextId: 'work',
    type: 'todo',
    config,
    x: 0,
    y: 0,
    w: 4,
    h: 6,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    version: 1,
  }
}

async function submitTitle(title: string, config: unknown = {}) {
  const wrapper = mount(TodoSettings, {
    props: { widget: widget(config) },
    global: { plugins: [ui, i18n] },
  })
  await wrapper.get('input').setValue(title)
  await wrapper.get('form').trigger('submit')
  await flushPromises()
  return wrapper
}

describe('TodoSettings', () => {
  it('saves the trimmed title and keeps the other fields of the config', async () => {
    const wrapper = await submitTitle('  Zakupy  ', { title: 'Stary', hideCompleted: true })
    expect(wrapper.emitted('save')).toEqual([
      [{ title: 'Zakupy', hideCompleted: true, source: { type: 'local' } }],
    ])
  })

  it('does not save a title longer than 60 characters', async () => {
    const wrapper = await submitTitle('a'.repeat(61))
    expect(wrapper.emitted('save')).toBeUndefined()
    expect(wrapper.text()).toContain('at most 60 characters')
  })

  it('saves "Hide completed" and keeps the title', async () => {
    const wrapper = mount(TodoSettings, {
      props: { widget: widget({ title: 'Zakupy' }) },
      global: { plugins: [ui, i18n] },
    })
    await wrapper.get('[role="switch"]').trigger('click')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.emitted('save')).toEqual([
      [{ title: 'Zakupy', hideCompleted: true, source: { type: 'local' } }],
    ])
  })
})
