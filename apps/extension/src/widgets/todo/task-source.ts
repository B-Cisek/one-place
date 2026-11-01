import type { TodoConfig } from '@one-place/shared'
import type { Ref } from 'vue'
import { useLocalTaskSource } from './local-task-source'

// What the task list needs from a source of tasks (D11). The list does not know where the tasks
// come from: today the One Place API, later e.g. Todoist through the backend.
export interface TaskItem {
  id: string
  text: string
  done: boolean
}

export interface TaskSource {
  // undefined until the first load
  items: Readonly<Ref<TaskItem[] | undefined>>
  isError: Readonly<Ref<boolean>>
  retry(): void
  capabilities: { reorder: boolean }
  add(text: string): void
  toggle(id: string): void
  edit(id: string, text: string): void
  remove(id: string): void
  // The new neighbours of the task, null at the start or the end of the list
  move(id: string, beforeId: string | null, afterId: string | null): void
}

// A composable: call it in setup(). A change of the source in the config needs a new widget.
export function useTaskSource(source: TodoConfig['source'], widgetId: string): TaskSource {
  switch (source.type) {
    case 'local':
      return useLocalTaskSource(widgetId)
  }
}
