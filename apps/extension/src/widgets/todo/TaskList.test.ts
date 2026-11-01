// @vitest-environment happy-dom
import ui from '@nuxt/ui/vue-plugin'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { VueDraggable } from 'vue-draggable-plus'
import { i18n } from '@/i18n'
import TaskList from './TaskList.vue'
import type { TaskItem } from './task-source'

const milk: TaskItem = { id: 'milk', text: 'Mleko', done: false }
const bread: TaskItem = { id: 'bread', text: 'Chleb', done: true }

// happy-dom reports navigator.language as en-US, so the texts are English
function mountList(items: TaskItem[] = [milk, bread], reorder = true) {
  return mount(TaskList, {
    props: { items, capabilities: { reorder } },
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

  describe('editing in place', () => {
    async function startEditing(wrapper: ReturnType<typeof mountList>, text: string) {
      // The text of a task is a button, so it can also be reached with the keyboard
      const milkText = wrapper.findAll('li button').find((button) => button.text() === 'Mleko')
      await milkText!.trigger('click')
      const input = wrapper.get('input[aria-label="Edit the task"]')
      await input.setValue(text)
      return input
    }

    it('saves the trimmed text on Enter only once, although the field also loses focus', async () => {
      const wrapper = mountList()
      const input = await startEditing(wrapper, '  Mleko 2%  ')
      // Without await in between: the browser reports the blur while the field is still there
      void input.trigger('keydown', { key: 'Enter' })
      await input.trigger('blur')
      expect(wrapper.emitted('edit')).toEqual([['milk', 'Mleko 2%']])
      expect(wrapper.find('input[aria-label="Edit the task"]').exists()).toBe(false)
    })

    it('saves when the field loses focus', async () => {
      const wrapper = mountList()
      const input = await startEditing(wrapper, 'Mleko 2%')
      await input.trigger('blur')
      expect(wrapper.emitted('edit')).toEqual([['milk', 'Mleko 2%']])
    })

    it('cancels on Escape, also when the field then loses focus', async () => {
      const wrapper = mountList()
      const input = await startEditing(wrapper, 'Mleko 2%')
      void input.trigger('keydown', { key: 'Escape' })
      await input.trigger('blur')
      expect(wrapper.emitted('edit')).toBeUndefined()
      expect(wrapper.findAll('li')[0]!.text()).toBe('Mleko')
    })

    it('treats an empty or unchanged text as a cancel', async () => {
      const wrapper = mountList()
      await (await startEditing(wrapper, '   ')).trigger('keydown', { key: 'Enter' })
      await (await startEditing(wrapper, 'Mleko')).trigger('keydown', { key: 'Enter' })
      expect(wrapper.emitted('edit')).toBeUndefined()
    })
  })

  describe('moving', () => {
    const butter: TaskItem = { id: 'butter', text: 'Masło', done: false }

    // happy-dom cannot drag, so the test does what VueDraggable does after a drop:
    // it reorders the list and reports the new index of the moved item
    async function drop(
      wrapper: ReturnType<typeof mountList>,
      order: TaskItem[],
      newIndex: number,
    ) {
      const draggable = wrapper.getComponent(VueDraggable)
      draggable.vm.$emit('update:modelValue', order)
      draggable.vm.$emit('update', { newIndex })
      await wrapper.vm.$nextTick()
    }

    it('reports the moved task with its new neighbours', async () => {
      const wrapper = mountList([milk, bread, butter])
      await drop(wrapper, [milk, butter, bread], 1)
      await drop(wrapper, [butter, milk, bread], 0)
      expect(wrapper.emitted('move')).toEqual([
        ['butter', 'milk', 'bread'],
        ['butter', null, 'milk'],
      ])
    })

    it('has no drag handles when the source cannot reorder', () => {
      const wrapper = mountList([milk, bread], false)
      expect(wrapper.find('[aria-label="Drag to change the order"]').exists()).toBe(false)
    })
  })
})
