// @vitest-environment happy-dom
import ui from '@nuxt/ui/vue-plugin'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { i18n } from '@/i18n'
import TaskList from './TaskList.vue'
import type { TaskItem } from './task-source'

const milk: TaskItem = { id: 'milk', text: 'Mleko', done: false }
const bread: TaskItem = { id: 'bread', text: 'Chleb', done: true }

// happy-dom reports navigator.language as en-US, so the texts are English
function mountList(items: TaskItem[] = [milk, bread]) {
  return mount(TaskList, {
    props: { items, capabilities: { reorder: true } },
    global: { plugins: [ui, i18n] },
  })
}

function newTaskInput(wrapper: ReturnType<typeof mountList>) {
  return wrapper.get('input[aria-label="Add a task"]')
}

describe('TaskList', () => {
  it('shows "No tasks" for an empty list', () => {
    expect(mountList([]).text()).toContain('No tasks')
  })

  it('shows the tasks in order and strikes through the done ones', () => {
    const wrapper = mountList()
    const rows = wrapper.findAll('li')
    expect(rows.map((row) => row.text())).toEqual(['Mleko', 'Chleb'])
    expect(rows[1]!.find('.line-through').exists()).toBe(true)
    expect(rows[0]!.find('.line-through').exists()).toBe(false)
  })

  it('adds the trimmed text on Enter and clears the field', async () => {
    const wrapper = mountList()
    const input = newTaskInput(wrapper)
    await input.setValue('  Masło  ')
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('add')).toEqual([['Masło']])
    expect((input.element as HTMLInputElement).value).toBe('')
  })

  it('ignores an empty text', async () => {
    const wrapper = mountList()
    const input = newTaskInput(wrapper)
    await input.setValue('   ')
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('add')).toBeUndefined()
  })

  it('reports a click on the checkbox and on the delete button', async () => {
    const wrapper = mountList()
    await wrapper.findAll('[role="checkbox"]')[1]!.trigger('click')
    await wrapper.findAll('button[aria-label="Delete the task"]')[0]!.trigger('click')
    expect(wrapper.emitted('toggle')).toEqual([['bread']])
    expect(wrapper.emitted('remove')).toEqual([['milk']])
  })
})
