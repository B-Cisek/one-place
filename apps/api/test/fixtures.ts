import { randomUUID } from 'node:crypto'
import type { CreateContextInput } from '@one-place/shared'

export function contextInput(overrides: Partial<CreateContextInput> = {}): CreateContextInput {
  return {
    id: randomUUID(),
    name: 'Praca',
    icon: 'i-lucide-briefcase',
    position: 'a0',
    ...overrides,
  }
}
