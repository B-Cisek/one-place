// @vitest-environment happy-dom
import ui from '@nuxt/ui/vue-plugin'
import type { WidgetDto } from '@one-place/shared'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { i18n } from '@/i18n'
import type { TaskItem } from './task-source'
import TodoWidget from './TodoWidget.vue'

const items = ref<TaskItem[] | undefined>()

vi.mock('./task-source', () => ({
  useTaskSource: () => ({
    items,
    isError: ref(false),
    retry: vi.fn(),
    capabilities: { reorder: true },
  }),
}))

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

function mountWidget(config: unknown) {
  return mount(TodoWidget, {
    props: { widget: widget(config) },
    global: { plugins: [ui, i18n] },
  })
}

beforeEach(() => {
  items.value = [
    { id: 'milk', text: 'Mleko', done: false },
    { id: 'bread', text: 'Chleb', done: true },
  ]
})

describe('TodoWidget', () => {
  it('shows the title and all tasks', () => {
    const wrapper = mountWidget({ title: 'Zakupy' })
    expect(wrapper.get('h2').text()).toBe('Zakupy')
    expect(wrapper.findAll('li').map((row) => row.text())).toEqual(['Mleko', 'Chleb'])
  })

  it('hides completed tasks when the config says so', () => {
    const wrapper = mountWidget({ hideCompleted: true })
    expect(wrapper.get('h2').text()).toBe('Tasks')
    expect(wrapper.findAll('li').map((row) => row.text())).toEqual(['Mleko'])
  })

  it('shows skeletons until the tasks are loaded', () => {
    items.value = undefined
    const wrapper = mountWidget({})
    expect(wrapper.find('li').exists()).toBe(false)
    expect(wrapper.findAll('.animate-pulse').length).toBe(3)
  })
})
