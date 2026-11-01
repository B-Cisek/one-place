// @vitest-environment happy-dom
import ui from '@nuxt/ui/vue-plugin'
import type { WidgetDto } from '@one-place/shared'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { i18n } from '@/i18n'
import type { WidgetDefinition } from '@/widgets/types'
import WidgetFrame from './WidgetFrame.vue'

const widgetComponent = vi.hoisted(() => ({ fails: false }))

// A widget whose render throws while `fails` is true
const FlakyWidget = defineComponent({
  props: { widget: { type: Object, required: true } },
  setup() {
    return () => {
      if (widgetComponent.fails) throw new Error('Boom')
      return h('p', 'Flaky widget works')
    }
  },
})

vi.mock('@/widgets/registry', () => ({
  findWidgetDefinition: (type: string): Partial<WidgetDefinition> | null =>
    type === 'todo'
      ? {
          type: 'todo',
          name: 'widgets.todo.name',
          icon: 'i-lucide-list-checks',
          component: () => Promise.resolve(FlakyWidget),
        }
      : null,
}))

function widget(type: string): WidgetDto {
  return {
    id: 'tasks',
    contextId: 'work',
    type,
    config: {},
    x: 0,
    y: 0,
    w: 4,
    h: 6,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    version: 1,
  }
}

async function mountFrame(type: string) {
  const wrapper = mount(WidgetFrame, {
    props: { widget: widget(type), editMode: false },
    global: { plugins: [ui, i18n] },
  })
  await flushPromises()
  return wrapper
}

describe('WidgetFrame', () => {
  // happy-dom reports navigator.language as en-US, so the texts are English
  beforeEach(() => {
    widgetComponent.fails = false
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('renders the widget of a known type', async () => {
    const wrapper = await mountFrame('todo')
    expect(wrapper.text()).toContain('Flaky widget works')
  })

  it('shows an error in the frame and mounts the widget again on retry', async () => {
    widgetComponent.fails = true
    const wrapper = await mountFrame('todo')
    expect(wrapper.text()).toContain('This widget stopped working')

    widgetComponent.fails = false
    const retry = wrapper.findAll('button').find((button) => button.text() === 'Try again')
    await retry?.trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Flaky widget works')
  })

  it('asks for a newer version of the extension for an unknown type', async () => {
    const wrapper = await mountFrame('notes')
    expect(wrapper.text()).toContain('This widget needs a newer version of the extension')
  })
})
