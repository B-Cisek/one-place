import { randomUUID } from 'node:crypto'
import type { CreateContextInput, CreateTodoInput, CreateWidgetInput } from '@one-place/shared'
export function contextInput(overrides: Partial<CreateContextInput> = {}): CreateContextInput {
  return {
    id: randomUUID(),
    name: 'Praca',
    icon: 'i-lucide-briefcase',
    position: 'a0',
    ...overrides,
  }
}

export function widgetInput(overrides: Partial<CreateWidgetInput> = {}): CreateWidgetInput {
  return { id: randomUUID(), type: 'todo', config: {}, x: 0, y: 0, w: 4, h: 6, ...overrides }
}

export function todoInput(overrides: Partial<CreateTodoInput> = {}): CreateTodoInput {
  return { id: randomUUID(), text: 'Mleko', position: 'a0', ...overrides }
}
