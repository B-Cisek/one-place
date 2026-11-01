import { z } from 'zod'
import { PositionSchema } from './contexts'

export const TODO_TEXT_MAX_LENGTH = 500
export const MAX_TODOS_PER_WIDGET = 500

// The task list ignores an empty text (F-TODO-01, F-TODO-03) and the field cannot take more
// than 500 characters, so these messages are never shown in the UI
export const TodoTextSchema = z
  .string()
  .trim()
  .min(1, 'A task needs a text')
  .max(TODO_TEXT_MAX_LENGTH, `A task can have at most ${TODO_TEXT_MAX_LENGTH} characters`)

export const CreateTodoSchema = z.object({
  id: z.uuid(),
  text: TodoTextSchema,
  position: PositionSchema,
})

// No widgetId: a task cannot move to another widget
export const UpdateTodoSchema = z
  .object({ text: TodoTextSchema, done: z.boolean(), position: PositionSchema })
  .partial()

export type CreateTodoInput = z.infer<typeof CreateTodoSchema>
export type UpdateTodoInput = z.infer<typeof UpdateTodoSchema>

export interface TodoDto {
  id: string
  widgetId: string
  text: string
  done: boolean
  position: string
  createdAt: string
  updatedAt: string
  version: number
}
